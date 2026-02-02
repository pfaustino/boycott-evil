/**
 * Migration script to add generic_name column to existing Turso database
 * 
 * Usage:
 *   node scripts/add-generic-name-column.js
 * 
 * Required environment variables:
 *   TURSO_DATABASE_URL - Your Turso database URL
 *   TURSO_AUTH_TOKEN - Your Turso auth token
 */

import { createClient } from '@libsql/client';

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

async function addGenericNameColumn() {
    console.log('Checking if generic_name column exists...');
    
    try {
        // Check if column exists by trying to select it
        await client.execute('SELECT generic_name FROM products LIMIT 1');
        console.log('✓ generic_name column already exists. No migration needed.');
        return;
    } catch (err) {
        // Column doesn't exist, need to add it
        console.log('generic_name column not found. Adding it...');
    }

    try {
        // SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS directly
        // So we'll use a try-catch approach
        await client.execute(`
            ALTER TABLE products 
            ADD COLUMN generic_name TEXT
        `);
        console.log('✓ Successfully added generic_name column to products table.');
        
        // Verify it was added
        const result = await client.execute('SELECT COUNT(*) as count FROM products');
        console.log(`✓ Migration complete. Database has ${result.rows[0].count} products.`);
    } catch (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
            console.log('✓ generic_name column already exists (detected during add).');
        } else {
            console.error('✗ Error adding column:', err.message);
            throw err;
        }
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('Adding generic_name column to products table');
    console.log('='.repeat(60));
    
    try {
        await addGenericNameColumn();
        console.log('\n✓ Migration completed successfully!');
    } catch (err) {
        console.error('\n✗ Migration failed:', err.message);
        process.exit(1);
    }
}

main().catch(console.error);
