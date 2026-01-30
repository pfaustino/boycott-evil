import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://boycott-evil-products-pfaustino.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3Njk3NTEzNzIsImlkIjoiYTk3YzY0MDEtNTI2MS00ZTFiLWJlZDItNGIzZTAxY2Q5MjdhIiwicmlkIjoiMjY4MjJhZDQtMDBlOC00ZTBiLWEyODEtOGNkYzE0ZmMwMTFmIn0.G5MT2EyGnicaShCmxahnRxy-WvEBTtnKCYtk3fYqsVAB5hyfy2UPc1PT-7YbqV_kPbGWHLBsq4GzBSLewDkjBg'
});

async function check() {
  // Total count
  const total = await client.execute('SELECT COUNT(*) as cnt FROM products');
  console.log('Total products:', total.rows[0].cnt);

  // Check prefix distribution (first digit of barcode)
  console.log('\nBarcode prefix distribution (first 2 digits):');
  const prefixes = await client.execute("SELECT substr(code, 1, 2) as prefix, COUNT(*) as cnt FROM products WHERE length(code) >= 12 GROUP BY prefix ORDER BY cnt DESC LIMIT 15");
  prefixes.rows.forEach(r => console.log(`  ${r.prefix}xx: ${r.cnt} products`));

  // Check for US barcodes (start with 0)
  const us = await client.execute("SELECT COUNT(*) as cnt FROM products WHERE code LIKE '0%' AND length(code) >= 12");
  console.log('\nUS barcodes (start with 0):', us.rows[0].cnt);

  // Sample some typical looking barcodes
  console.log('\nSample US products (0xxx...):');
  const sampleUS = await client.execute("SELECT code, product_name, brands FROM products WHERE code LIKE '00%' AND length(code) = 13 AND product_name != '' LIMIT 10");
  sampleUS.rows.forEach(r => console.log(`  ${r.code} - ${(r.product_name || '').substring(0, 35)} (${r.brands})`));

  // Sample European barcodes (3xxx, 4xxx, 5xxx)
  console.log('\nSample EU products (3xxx...):');
  const sampleEU = await client.execute("SELECT code, product_name, brands FROM products WHERE code LIKE '3%' AND length(code) = 13 AND product_name != '' LIMIT 5");
  sampleEU.rows.forEach(r => console.log(`  ${r.code} - ${(r.product_name || '').substring(0, 35)} (${r.brands})`));

  // Search for common brands
  console.log('\nSearching for Coca-Cola products...');
  const coke = await client.execute("SELECT code, product_name, brands FROM products WHERE lower(brands) LIKE '%coca%' OR lower(product_name) LIKE '%coca%' LIMIT 5");
  console.log('Found:', coke.rows.length);
  coke.rows.forEach(r => console.log(`  ${r.code} - ${r.product_name} (${r.brands})`));

  console.log('\nSearching for Pepsi products...');  
  const pepsi = await client.execute("SELECT code, product_name, brands FROM products WHERE lower(brands) LIKE '%pepsi%' OR lower(product_name) LIKE '%pepsi%' LIMIT 5");
  console.log('Found:', pepsi.rows.length);
  pepsi.rows.forEach(r => console.log(`  ${r.code} - ${r.product_name} (${r.brands})`));

  console.log('\nSearching for Nestle products...');  
  const nestle = await client.execute("SELECT code, product_name, brands FROM products WHERE lower(brands) LIKE '%nestle%' OR lower(brands) LIKE '%nestlé%' LIMIT 5");
  console.log('Found:', nestle.rows.length);
  nestle.rows.forEach(r => console.log(`  ${r.code} - ${(r.product_name || '').substring(0,30)} (${r.brands})`));

  // Test a specific lookup with smart prefix matching
  const testCode = process.argv[2];
  if (testCode) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`SMART SEARCH: ${testCode}`);
    console.log('='.repeat(50));
    
    const padded = testCode.padStart(13, '0');
    
    // 1. Try exact match
    const exact = await client.execute({ sql: "SELECT * FROM products WHERE code = ? OR code = ?", args: [testCode, padded] });
    if (exact.rows.length > 0) {
      console.log('✅ EXACT MATCH:', exact.rows[0].product_name, '(' + exact.rows[0].brands + ')');
    } else {
      console.log('❌ No exact match');
      
      // 2. Try prefix matching
      for (const prefixLen of [10, 9, 8, 7, 6]) {
        if (padded.length < prefixLen) continue;
        const prefix = padded.substring(0, prefixLen);
        
        const prefixResult = await client.execute({
          sql: "SELECT code, product_name, brands FROM products WHERE code LIKE ? LIMIT 5",
          args: [`${prefix}%`]
        });
        
        if (prefixResult.rows.length > 0) {
          console.log(`\n🔗 PREFIX MATCH (${prefixLen} digits: ${prefix}...):`);
          prefixResult.rows.forEach(r => {
            console.log(`   ${r.code} - ${r.product_name} (${r.brands})`);
          });
          break;
        }
      }
    }
  }
}

check().catch(console.error);
