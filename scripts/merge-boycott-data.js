/**
 * Merge Israel boycott data into evil-companies.json
 * 
 * This script reads from:
 * - app/public/evil-companies.json (existing)
 * - app/public/boycott-isaraeli-consumer-goods-dataset/*.json
 * 
 * And outputs merged data back to evil-companies.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basePath = join(__dirname, '..', 'app', 'public');

function loadJSON(filename) {
    const filepath = join(basePath, filename);
    return JSON.parse(readFileSync(filepath, 'utf-8'));
}

function saveJSON(filename, data) {
    const filepath = join(basePath, filename);
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

async function main() {
    console.log('Loading existing evil-companies.json...');
    const evilCompanies = loadJSON('evil-companies.json');
    console.log(`  Found ${Object.keys(evilCompanies).length} companies`);

    // Load boycott_list_formatted.json
    console.log('\nLoading boycott_list_formatted.json...');
    const boycottList = loadJSON('boycott-isaraeli-consumer-goods-dataset/boycott_list_formatted.json');
    console.log(`  Found ${boycottList.length} entries`);

    let added = 0;
    let updated = 0;

    for (const item of boycottList) {
        // Handle nested structure: item.attributes.name
        const attrs = item.attributes || item;
        const name = (attrs.name || item.name)?.toLowerCase().trim();
        if (!name) continue;

        const reason = attrs.proof || item.proof || `Boycott target - ${name}`;

        if (evilCompanies[name]) {
            // Update existing - add Israel to supports if not present
            if (!evilCompanies[name].supports) {
                evilCompanies[name].supports = [];
            }
            if (!evilCompanies[name].supports.includes('Israel')) {
                evilCompanies[name].supports.push('Israel');
                updated++;
            }
            // Append reason if different
            if (reason && !evilCompanies[name].reason?.includes(reason.substring(0, 50))) {
                evilCompanies[name].reason = (evilCompanies[name].reason || '') + ' | ' + reason.substring(0, 200);
            }
        } else {
            // Add new company
            evilCompanies[name] = {
                evil: true,
                reason: reason.substring(0, 300),
                alternatives: [],
                supports: ['Israel']
            };
            added++;
        }
    }

    // Load witness_w_il.json
    console.log('\nLoading witness_w_il.json...');
    const witnessData = loadJSON('boycott-isaraeli-consumer-goods-dataset/witness_w_il.json');
    console.log(`  Found ${witnessData.length} entries`);

    for (const item of witnessData) {
        const name = item.Name?.toLowerCase().trim();
        if (!name) continue;

        const reason = item.Description || `Listed in witness database`;

        if (evilCompanies[name]) {
            if (!evilCompanies[name].supports) {
                evilCompanies[name].supports = [];
            }
            if (!evilCompanies[name].supports.includes('Israel')) {
                evilCompanies[name].supports.push('Israel');
                updated++;
            }
        } else {
            evilCompanies[name] = {
                evil: true,
                reason: reason.substring(0, 300),
                alternatives: [],
                supports: ['Israel']
            };
            added++;
        }
    }

    console.log(`\nMerge complete:`);
    console.log(`  Added: ${added} new companies`);
    console.log(`  Updated: ${updated} existing companies`);
    console.log(`  Total: ${Object.keys(evilCompanies).length} companies`);

    // Save merged data
    console.log('\nSaving to evil-companies.json...');
    saveJSON('evil-companies.json', evilCompanies);
    console.log('Done!');

    // Show some samples
    console.log('\nSample entries with Israel support:');
    const samples = Object.entries(evilCompanies)
        .filter(([_, v]) => v.supports?.includes('Israel'))
        .slice(0, 10);
    for (const [name, data] of samples) {
        console.log(`  - ${name}: ${data.supports.join(', ')}`);
    }
}

main().catch(console.error);
