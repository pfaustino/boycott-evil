/**
 * Import CSV product data into Turso database
 * 
 * Usage:
 *   node scripts/import-to-turso.js
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
    console.error('');
    console.error('Set them like this:');
    console.error('  $env:TURSO_DATABASE_URL="libsql://your-db.turso.io"');
    console.error('  $env:TURSO_AUTH_TOKEN="your-token"');
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
            normalized_brand TEXT
        )
    `);
    
    // Create indexes for faster lookups
    console.log('Creating indexes...');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_normalized_brand ON products(normalized_brand)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_product_name ON products(product_name)');
    
    console.log('Table and indexes created successfully.');
}

async function importCSV(filePath) {
    console.log(`Importing from: ${filePath}`);
    
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let headers = null;
    let batch = [];
    let totalImported = 0;
    const BATCH_SIZE = 500;

    for await (const line of rl) {
        if (!headers) {
            headers = line.split(',').map(h => h.trim().toLowerCase());
            console.log('Headers found:', headers);
            continue;
        }

        // Parse CSV line (simple parser, handles basic cases)
        const values = parseCSVLine(line);
        
        if (values.length < headers.length) continue;

        const codeIdx = headers.indexOf('code');
        const nameIdx = headers.indexOf('product_name');
        const brandsIdx = headers.indexOf('brands');

        const code = values[codeIdx]?.trim();
        const productName = values[nameIdx]?.trim() || '';
        const brands = values[brandsIdx]?.trim() || '';

        if (!code) continue;

        const normalizedBrand = brands.split(',')[0].trim().toLowerCase();

        batch.push({
            code,
            product_name: productName,
            brands,
            normalized_brand: normalizedBrand,
        });

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            totalImported += batch.length;
            console.log(`Imported ${totalImported} products...`);
            batch = [];
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await insertBatch(batch);
        totalImported += batch.length;
    }

    console.log(`\nTotal imported: ${totalImported} products`);
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    
    return values;
}

async function insertBatch(batch) {
    // Use a transaction for better performance
    const placeholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
    const args = batch.flatMap(p => [
        p.code,
        p.product_name,
        p.brands,
        p.normalized_brand,
    ]);

    await client.execute({
        sql: `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand) VALUES ${placeholders}`,
        args,
    });
}

async function main() {
    try {
        console.log('Connecting to Turso database...');
        console.log(`URL: ${TURSO_DATABASE_URL}`);
        
        // Test connection
        await client.execute('SELECT 1');
        console.log('Connected successfully!\n');

        await createTable();

        // Import from CSV
        const csvPath = join(__dirname, '..', 'app', 'public', 'off-mini.csv');
        await importCSV(csvPath);

        // Show final count
        const result = await client.execute('SELECT COUNT(*) as count FROM products');
        console.log(`\nDatabase now contains ${result.rows[0].count} products.`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
