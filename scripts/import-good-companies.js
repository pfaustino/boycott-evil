/**
 * Import GOOD companies from DEI Boycott data
 * 
 * Companies marked "Yes" in "Not Evil" column are pro-DEI
 * These will show as "Recommended" with green badges
 * 
 * Reads: public/Boycott DEI.tsv
 * Writes: app/public/good-companies.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsvPath = path.join(__dirname, '..', 'public', 'Boycott DEI.tsv');
const goodCompaniesPath = path.join(__dirname, '..', 'app', 'public', 'good-companies.json');

function parseTSV(content) {
    const lines = content.split('\n');
    const results = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split('\t');
        
        // Columns: 0=row#, 1=Brand, 2=NotEvil, 3=Type, 4=DEIStatus, 5=Notes, 6=url, 7=Alternatives
        const brand = columns[1]?.trim();
        const notEvil = columns[2]?.trim();
        const type = columns[3]?.trim();
        const deiStatus = columns[4]?.trim();
        const notes = columns[5]?.trim();
        const url = columns[6]?.trim();
        
        if (brand) {
            results.push({
                brand,
                notEvil,
                type,
                deiStatus,
                notes,
                url
            });
        }
    }
    
    return results;
}

function main() {
    // Read TSV
    console.log(`Reading: ${tsvPath}`);
    const tsvContent = fs.readFileSync(tsvPath, 'utf8');
    const deiData = parseTSV(tsvContent);
    console.log(`Parsed ${deiData.length} companies from DEI data`);
    
    const goodCompanies = {};
    let added = 0;
    let skipped = 0;
    
    for (const entry of deiData) {
        // Only process companies marked as good (Not Evil = "Yes")
        if (entry.notEvil !== 'Yes') {
            skipped++;
            continue;
        }
        
        const normalizedName = entry.brand.toLowerCase().trim();
        
        // Build reason string
        let reason = entry.deiStatus || 'Supports DEI';
        if (entry.notes && entry.notes !== 'Notes' && entry.notes.length > 5) {
            reason += ` - ${entry.notes}`;
        }
        
        // Build citation if URL exists
        let citations = [];
        if (entry.url && entry.url !== '' && entry.url.startsWith('http')) {
            citations.push({
                url: entry.url,
                source: 'Company DEI Page',
                title: `${entry.brand} DEI Policy`,
                date: '2025-01'
            });
        }
        
        // Determine supports based on DEI status
        const supports = ['Pro-DEI'];
        
        goodCompanies[normalizedName] = {
            good: true,
            reason: reason,
            category: entry.type || 'General',
            supports: supports,
            citations: citations.length > 0 ? citations : undefined
        };
        added++;
    }
    
    // Write good companies file
    fs.writeFileSync(goodCompaniesPath, JSON.stringify(goodCompanies, null, 2), 'utf8');
    
    console.log(`\nImport complete!`);
    console.log(`  Added: ${added} good companies`);
    console.log(`  Skipped: ${skipped} non-good companies`);
    
    // Show some examples
    console.log(`\nSample good companies:`);
    const samples = Object.entries(goodCompanies).slice(0, 10);
    samples.forEach(([name, data]) => {
        console.log(`  - ${name}: ${data.reason}`);
    });
}

main();
