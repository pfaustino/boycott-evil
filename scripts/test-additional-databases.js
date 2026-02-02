/**
 * Test script to verify CSV/TSV field mapping before import
 * 
 * This script reads a few sample rows from each database and shows:
 * - Product code (barcode)
 * - Product name
 * - Brand(s)
 * - Normalized brand
 * 
 * Usage:
 *   node scripts/test-additional-databases.js
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        return null;
    }
    return null;
}

function parseTSVLine(line) {
    return line.split('\t').map(v => v.trim());
}

async function testFile(filePath, sourceName, sampleSize = 5) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${sourceName}`);
    console.log(`File: ${filePath}`);
    console.log('='.repeat(70));

    return new Promise((resolve, reject) => {
        const fileStream = createReadStream(filePath);
        const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let headers = null;
        let samples = [];
        let lineCount = 0;

        rl.on('line', (line) => {
            if (!headers) {
                headers = parseTSVLine(line);
                console.log(`\nHeaders found (${headers.length} columns):`);
                console.log(`  Key columns:`);
                const keyCols = ['code', 'product_name', 'brands', 'brands_tags', 'product_name_en', 'generic_name'];
                keyCols.forEach(col => {
                    const idx = headers.indexOf(col);
                    if (idx !== -1) {
                        console.log(`    ✓ ${col} (column ${idx})`);
                    } else {
                        console.log(`    ✗ ${col} (NOT FOUND)`);
                    }
                });
                return;
            }

            lineCount++;
            if (samples.length >= sampleSize) {
                if (lineCount > sampleSize) {
                    rl.close();
                    return;
                }
            }

            const values = parseTSVLine(line);
            if (values.length < headers.length) return;

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
            const genericName = genericNameIdx !== -1 ? values[genericNameIdx]?.trim() || '' : '';

            if (code) {
                const normalizedBrand = brands ? brands.split(',')[0].trim().toLowerCase() : '';
                samples.push({
                    code,
                    product_name: productName || '(no name)',
                    brands: brands || '(no brand)',
                    normalized_brand: normalizedBrand || '(no brand)',
                    generic_name: genericName || '(no generic name)',
                });
            }
        });

        rl.on('close', () => {
            console.log(`\nSample rows (showing ${samples.length} of ${lineCount} total):`);
            console.log('-'.repeat(70));
            
            samples.forEach((sample, idx) => {
                console.log(`\nSample ${idx + 1}:`);
                console.log(`  Code (Barcode):     ${sample.code || 'MISSING'}`);
                console.log(`  Product Name:       ${sample.product_name.substring(0, 60)}${sample.product_name.length > 60 ? '...' : ''}`);
                console.log(`  Generic Name:       ${sample.generic_name.substring(0, 60)}${sample.generic_name.length > 60 ? '...' : ''}`);
                console.log(`  Brands:             ${sample.brands.substring(0, 60)}${sample.brands.length > 60 ? '...' : ''}`);
                console.log(`  Normalized Brand:   ${sample.normalized_brand || 'MISSING'}`);
            });

            console.log(`\n✓ File structure looks good!`);
            resolve({ samples, totalLines: lineCount });
        });

        rl.on('error', (err) => {
            console.error(`\n✗ Error reading file:`, err.message);
            reject(err);
        });
    });
}

async function main() {
    const rootDir = join(__dirname, '..');
    const sourcesDir = join(rootDir, 'sources');
    
    console.log('Testing Additional Database Files');
    console.log('='.repeat(70));
    console.log(`Root directory: ${rootDir}`);
    console.log(`Sources directory: ${sourcesDir}\n`);

    const databases = [
        { 
            name: 'Open Beauty Facts', 
            path: join(sourcesDir, 'en.openbeautyfacts.org.products.csv') 
        },
        { 
            name: 'Open Pet Food Facts', 
            path: join(sourcesDir, 'en.openpetfoodfacts.org.products.csv') 
        },
        { 
            name: 'Open Products Facts', 
            path: join(sourcesDir, 'en.openproductsfacts.org.products.csv') 
        },
    ];

    const results = [];

    for (const db of databases) {
        const csvFile = findCSVFile(db.path);
        if (csvFile) {
            try {
                const result = await testFile(csvFile, db.name);
                results.push({ ...db, csvFile, success: true, ...result });
            } catch (err) {
                console.error(`\n✗ Error testing ${db.name}:`, err.message);
                results.push({ ...db, csvFile, success: false, error: err.message });
            }
        } else {
            console.log(`\n✗ File not found: ${db.name} (${db.path})`);
            results.push({ ...db, success: false, error: 'File not found' });
        }
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('SUMMARY');
    console.log('='.repeat(70));
    
    results.forEach(result => {
        if (result.success) {
            console.log(`\n✓ ${result.name}:`);
            console.log(`  File: ${result.csvFile}`);
            console.log(`  Sample rows tested: ${result.samples.length}`);
            console.log(`  Total rows in file: ${result.totalLines.toLocaleString()}`);
        } else {
            console.log(`\n✗ ${result.name}: ${result.error}`);
        }
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log('Next Steps:');
    console.log('  1. Review the sample data above');
    console.log('  2. Verify codes (barcodes) are valid');
    console.log('  3. Verify brands are extracted correctly');
    console.log('  4. If everything looks good, run: node scripts/import-additional-databases.js');
    console.log('='.repeat(70));
}

main().catch(console.error);
