/**
 * Import DEI Boycott data into evil-companies.json
 * 
 * Reads: public/Boycott DEI.tsv
 * Updates: app/public/evil-companies.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsvPath = path.join(__dirname, '..', 'public', 'Boycott DEI.tsv');
const evilCompaniesPath = path.join(__dirname, '..', 'app', 'public', 'evil-companies.json');

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
        const alternatives = columns[7]?.trim();
        
        if (brand) {
            results.push({
                brand,
                notEvil,
                type,
                deiStatus,
                notes,
                url,
                alternatives
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
    
    // Read existing evil companies
    console.log(`Reading: ${evilCompaniesPath}`);
    const existingData = JSON.parse(fs.readFileSync(evilCompaniesPath, 'utf8'));
    console.log(`Existing evil companies: ${Object.keys(existingData).length}`);
    
    let added = 0;
    let merged = 0;
    let skipped = 0;
    
    for (const entry of deiData) {
        // Only process companies marked as evil (Not Evil = "No")
        if (entry.notEvil !== 'No') {
            skipped++;
            continue;
        }
        
        const normalizedName = entry.brand.toLowerCase().trim();
        
        // Build reason string
        let reason = entry.deiStatus || 'DEI Rollback';
        if (entry.notes && entry.notes !== 'Notes' && entry.notes.length > 5) {
            reason += ` - ${entry.notes}`;
        }
        
        // Parse alternatives
        let alternatives = [];
        if (entry.alternatives && entry.alternatives !== 'Alternatives') {
            alternatives = entry.alternatives.split(',').map(a => a.trim()).filter(Boolean);
        }
        
        if (existingData[normalizedName]) {
            // Merge with existing entry
            const existing = existingData[normalizedName];
            
            // Add Anti-DEI to supports if not already present
            if (!existing.supports) {
                existing.supports = [];
            }
            if (!existing.supports.includes('Anti-DEI')) {
                existing.supports.push('Anti-DEI');
            }
            
            // Append reason if different
            if (reason && !existing.reason?.includes(reason)) {
                existing.reason = existing.reason 
                    ? `${existing.reason} | ${reason}`
                    : reason;
            }
            
            // Merge alternatives
            if (alternatives.length > 0) {
                if (!existing.alternatives) {
                    existing.alternatives = [];
                }
                for (const alt of alternatives) {
                    if (!existing.alternatives.includes(alt)) {
                        existing.alternatives.push(alt);
                    }
                }
            }
            
            merged++;
        } else {
            // Add new entry
            existingData[normalizedName] = {
                evil: true,
                reason: reason,
                alternatives: alternatives,
                supports: ['Anti-DEI']
            };
            added++;
        }
    }
    
    // Write updated file
    fs.writeFileSync(evilCompaniesPath, JSON.stringify(existingData, null, 2), 'utf8');
    
    console.log(`\nImport complete!`);
    console.log(`  Added: ${added} new companies`);
    console.log(`  Merged: ${merged} existing companies`);
    console.log(`  Skipped: ${skipped} non-evil companies`);
    console.log(`  Total evil companies: ${Object.keys(existingData).length}`);
}

main();
