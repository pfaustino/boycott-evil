/**
 * Import TSV product data into Turso database
 * 
 * Usage:
 *   node scripts/import-tsv-to-turso.js
 * 
 * Required environment variables:
 *   TURSO_DATABASE_URL - Your Turso database URL
 *   TURSO_AUTH_TOKEN - Your Turso auth token
 */

import { createClient } from '@libsql/client';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function createTable() {
    console.log('Creating products table...');
    await client.execute(`
        CREATE TABLE IF NOT EXISTS products (
            code TEXT PRIMARY KEY,
            product_name TEXT,
            brands TEXT,
            normalized_brand TEXT,
            generic_name TEXT
        )
    `);
    
    console.log('Creating indexes...');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_normalized_brand ON products(normalized_brand)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_product_name ON products(product_name)');
    
    console.log('Table and indexes created successfully.');
}

async function importTSV(filePath) {
    console.log(`Importing from: ${filePath}`);
    console.log('This may take several minutes for large files...');
    
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let headers = null;
    let codeIdx = -1;
    let nameIdx = -1;
    let brandsIdx = -1;
    let genericNameIdx = -1;
    
    let batch = [];
    let totalImported = 0;
    let skipped = 0;
    const BATCH_SIZE = 1000;
    const startTime = Date.now();

    for await (const line of rl) {
        if (!headers) {
            // Parse header line (tab-separated)
            headers = line.split('\t').map(h => h.trim().toLowerCase());
            codeIdx = headers.indexOf('code');
            nameIdx = headers.indexOf('product_name');
            brandsIdx = headers.indexOf('brands');
            genericNameIdx = headers.indexOf('generic_name');
            
            console.log(`Found columns: code=${codeIdx}, product_name=${nameIdx}, brands=${brandsIdx}, generic_name=${genericNameIdx}`);
            
            if (codeIdx === -1 || nameIdx === -1) {
                throw new Error('Required columns (code, product_name) not found in TSV');
            }
            continue;
        }

        // Parse TSV line
        const values = line.split('\t');
        
        const code = values[codeIdx]?.trim();
        const productName = values[nameIdx]?.trim() || '';
        const brands = brandsIdx >= 0 ? (values[brandsIdx]?.trim() || '') : '';
        const genericName = genericNameIdx >= 0 ? (values[genericNameIdx]?.trim() || '') : '';

        if (!code) {
            skipped++;
            continue;
        }

        const normalizedBrand = brands.split(',')[0].trim().toLowerCase();

        batch.push({
            code,
            product_name: productName.substring(0, 500), // Truncate long names
            brands: brands.substring(0, 500),
            normalized_brand: normalizedBrand,
            generic_name: genericName.substring(0, 500), // Truncate long generic names
        });

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            totalImported += batch.length;
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (totalImported / elapsed).toFixed(0);
            console.log(`Imported ${totalImported.toLocaleString()} products... (${rate}/sec)`);
            
            batch = [];
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await insertBatch(batch);
        totalImported += batch.length;
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nImport complete!`);
    console.log(`  Total imported: ${totalImported.toLocaleString()} products`);
    console.log(`  Skipped: ${skipped.toLocaleString()} (no code)`);
    console.log(`  Time: ${totalTime} seconds`);
}

async function insertBatch(batch) {
    // Build multi-row insert
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const args = batch.flatMap(p => [
        p.code,
        p.product_name,
        p.brands,
        p.normalized_brand,
        p.generic_name || '', // Handle missing generic_name
    ]);

    try {
        await client.execute({
            sql: `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand, generic_name) VALUES ${placeholders}`,
            args,
        });
    } catch (error) {
        console.error('Batch insert failed:', error.message);
        // Try inserting one by one
        for (const p of batch) {
            try {
                await client.execute({
                    sql: `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand) VALUES (?, ?, ?, ?)`,
                    args: [p.code, p.product_name, p.brands, p.normalized_brand],
                });
            } catch (e) {
                // Skip problematic rows
            }
        }
    }
}

async function main() {
    try {
        console.log('Connecting to Turso database...');
        console.log(`URL: ${TURSO_DATABASE_URL}`);
        
        // Test connection
        await client.execute('SELECT 1');
        console.log('Connected successfully!\n');

        await createTable();

        // Import from TSV
        const tsvPath = join(__dirname, '..', 'app', 'public', 'off-full.tsv');
        await importTSV(tsvPath);

        // Show final count
        const result = await client.execute('SELECT COUNT(*) as count FROM products');
        console.log(`\nDatabase now contains ${Number(result.rows[0].count).toLocaleString()} products.`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
