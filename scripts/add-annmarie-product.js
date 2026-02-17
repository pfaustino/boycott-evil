/**
 * Add Annmarie Skin Care product to Turso database
 * 
 * Usage:
 *   node scripts/add-annmarie-product.js
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

async function addAnnmarieProduct() {
    const upc = '0689741146927'; // Normalized UPC (with leading 0)
    const productName = 'Annmarie Skin Care - Ayurvedic Facial Scrub, 50ML';
    const brands = 'Annmarie Skin Care';
    const normalizedBrand = 'annmarie skin care';
    const genericName = '';

    console.log('Adding Annmarie Skin Care product to database...');
    console.log(`UPC: ${upc}`);
    console.log(`Brand: ${brands}`);

    try {
        await client.execute({
            sql: `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand, generic_name) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [upc, productName, brands, normalizedBrand, genericName],
        });

        console.log('✓ Successfully added Annmarie Skin Care product!');
        console.log(`\nProduct will now be recognized when scanned.`);
        console.log(`Since "annmarie skin care" is in the good companies list,`);
        console.log(`it will show as a "⭐ Recommended Company".`);
    } catch (error) {
        console.error('✗ Error adding product:', error.message);
        process.exit(1);
    }
}

addAnnmarieProduct().catch(console.error);
