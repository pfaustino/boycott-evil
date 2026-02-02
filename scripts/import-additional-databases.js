/**
 * Import additional Open Facts databases (Beauty, Pet Food, Products) into Turso
 * 
 * This script imports:
 * - Open Beauty Facts (beauty products)
 * - Open Pet Food Facts (pet food)
 * - Open Products Facts (other consumer products)
 * 
 * Usage:
 *   node scripts/import-additional-databases.js
 * 
 * Required environment variables:
 *   TURSO_DATABASE_URL - Your Turso database URL
 *   TURSO_AUTH_TOKEN - Your Turso auth token
 * 
 * Files should be in the root directory:
 *   - en.openbeautyfacts.org.products.csv/
 *   - en.openpetfoodfacts.org.products.csv/
 *   - en.openproductsfacts.org.products.csv/
 */

import { createClient } from '@libsql/client';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required.');
    process.exit(1);
}

const client = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
});

// Find CSV file in directory (handles case where it's a folder with CSV inside)
function findCSVFile(dirPath) {
    try {
        const stats = statSync(dirPath);
        if (stats.isFile() && dirPath.endsWith('.csv')) {
            return dirPath;
        }
        if (stats.isDirectory()) {
            const files = readdirSync(dirPath);
            const csvFile = files.find(f => f.endsWith('.csv'));
            if (csvFile) {
                return join(dirPath, csvFile);
            }
        }
    } catch (err) {
        console.error(`Error accessing ${dirPath}:`, err.message);
    }
    return null;
}

async function importTSV(filePath, sourceName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Importing ${sourceName} from: ${filePath}`);
    console.log('This may take several minutes for large files...');
    
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let headers = null;
    let batch = [];
    let totalImported = 0;
    let totalSkipped = 0;
    const BATCH_SIZE = 500;

    for await (const line of rl) {
        if (!headers) {
            // TSV format - tab-separated
            headers = line.split('\t').map(h => h.trim().toLowerCase());
            console.log('Headers found:', headers.slice(0, 10).join(', '), '...');
            continue;
        }

        // Skip empty lines
        if (!line.trim()) continue;

        // Parse TSV line (tab-separated)
        const values = parseTSVLine(line);
        
        if (values.length < headers.length) {
            totalSkipped++;
            continue;
        }

        const codeIdx = headers.indexOf('code');
        const nameIdx = headers.indexOf('product_name') !== -1 
            ? headers.indexOf('product_name')
            : headers.indexOf('product_name_en') !== -1
            ? headers.indexOf('product_name_en')
            : -1;
        const brandsIdx = headers.indexOf('brands') !== -1
            ? headers.indexOf('brands')
            : headers.indexOf('brands_tags') !== -1
            ? headers.indexOf('brands_tags')
            : -1;
        const genericNameIdx = headers.indexOf('generic_name');

        const code = codeIdx !== -1 ? values[codeIdx]?.trim() : null;
        const productName = nameIdx !== -1 ? values[nameIdx]?.trim() || '' : '';
        const brands = brandsIdx !== -1 ? values[brandsIdx]?.trim() || '' : '';
        const genericName = genericNameIdx !== -1 ? (values[genericNameIdx]?.trim() || '') : '';

        if (!code) {
            totalSkipped++;
            continue;
        }

        const normalizedBrand = brands ? brands.split(',')[0].trim().toLowerCase() : '';

        batch.push({
            code,
            product_name: productName,
            brands,
            normalized_brand: normalizedBrand,
            generic_name: genericName,
        });

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            totalImported += batch.length;
            process.stdout.write(`\r${sourceName}: Imported ${totalImported.toLocaleString()} products...`);
            batch = [];
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await insertBatch(batch);
        totalImported += batch.length;
    }

    console.log(`\n${sourceName} complete: ${totalImported.toLocaleString()} imported, ${totalSkipped.toLocaleString()} skipped`);
    return totalImported;
}

function parseTSVLine(line) {
    // TSV format - simple tab split (no quotes to handle)
    return line.split('\t').map(v => v.trim());
}

async function insertBatch(batch) {
    if (batch.length === 0) return;

    // Use INSERT OR REPLACE to merge data - if barcode exists, update with new data
    // This allows products from different databases (food, beauty, pet, products) to update each other
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const values = batch.flatMap(p => [
        p.code, 
        p.product_name, 
        p.brands, 
        p.normalized_brand,
        p.generic_name || '' // Handle missing generic_name
    ]);
    
    await client.execute(
        `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand, generic_name) VALUES ${placeholders}`,
        values
    );
}

async function getCurrentCount() {
    const result = await client.execute('SELECT COUNT(*) as count FROM products');
    return result.rows[0].count;
}

async function main() {
    const rootDir = join(__dirname, '..');
    const sourcesDir = join(rootDir, 'sources');
    
    console.log('Finding database files...\n');
    
    const databases = [
        { name: 'Open Beauty Facts', path: join(sourcesDir, 'en.openbeautyfacts.org.products.csv') },
        { name: 'Open Pet Food Facts', path: join(sourcesDir, 'en.openpetfoodfacts.org.products.csv') },
        { name: 'Open Products Facts', path: join(sourcesDir, 'en.openproductsfacts.org.products.csv') },
    ];

    const initialCount = await getCurrentCount();
    console.log(`Current products in database: ${initialCount.toLocaleString()}\n`);

    let totalImported = 0;
    const foundFiles = [];

    for (const db of databases) {
        const csvFile = findCSVFile(db.path);
        if (csvFile) {
            foundFiles.push({ ...db, csvFile });
            console.log(`✓ Found: ${db.name} -> ${csvFile}`);
        } else {
            console.log(`✗ Not found: ${db.name} (${db.path})`);
        }
    }

    if (foundFiles.length === 0) {
        console.error('\nNo CSV files found! Make sure the folders/files exist in the root directory.');
        process.exit(1);
    }

    console.log(`\nFound ${foundFiles.length} database(s) to import.\n`);

    for (const db of foundFiles) {
        try {
            const imported = await importTSV(db.csvFile, db.name);
            totalImported += imported;
        } catch (err) {
            console.error(`\nError importing ${db.name}:`, err.message);
        }
    }

    const finalCount = await getCurrentCount();
    const newProducts = finalCount - initialCount;

    console.log(`\n${'='.repeat(60)}`);
    console.log('Import Summary:');
    console.log(`  Initial count: ${initialCount.toLocaleString()}`);
    console.log(`  New products: ${newProducts.toLocaleString()}`);
    console.log(`  Final count: ${finalCount.toLocaleString()}`);
    console.log(`  Total imported this run: ${totalImported.toLocaleString()}`);
    console.log(`\nNote: Some products may have been skipped if barcodes already existed.`);
}

main().catch(console.error);
