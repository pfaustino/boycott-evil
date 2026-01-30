import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const result = await client.execute(
    "SELECT code, product_name, brands, normalized_brand FROM products WHERE product_name LIKE '%Activia%' LIMIT 5"
);

console.log('Activia products:');
for (const row of result.rows) {
    console.log(`  Brand: "${row.brands}" → Normalized: "${row.normalized_brand}"`);
}
