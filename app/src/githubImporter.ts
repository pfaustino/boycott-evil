/**
 * Local Data Importer for TechForPalestine Boycott Dataset
 * Imports boycott data from local files in:
 * /boycott-isaraeli-consumer-goods-dataset/
 */

import Papa from 'papaparse';
import { db, type Product } from './db';
import type { EvilCompanies } from './dataLoader';

const LOCAL_DATA_BASE = '/boycott-isaraeli-consumer-goods-dataset';

/**
 * Fetch a local file from public directory
 */
async function fetchLocalFile(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    return await response.text();
}

/**
 * Parse TSV/CSV data into structured format
 */
async function parseDelimitedData(text: string, delimiter: string = '\t'): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            delimiter: delimiter,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

/**
 * Normalize company/brand name for consistent lookup
 */
function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

/**
 * Import companies/brands from local dataset files
 * Merges with existing evil companies, adding "Israel" to supports array
 */
export async function importBoycottCompanies(
    existingCompanies: EvilCompanies,
    onProgress?: (message: string) => void
): Promise<EvilCompanies> {
    const merged = { ...existingCompanies };
    let totalImported = 0;
    let totalMerged = 0;

    // 1. Import from witness_w_il.json
    try {
        if (onProgress) onProgress('Loading witness_w_il.json...');
        const witnessText = await fetchLocalFile(`${LOCAL_DATA_BASE}/witness_w_il.json`);
        const witnessData = JSON.parse(witnessText) as any[];

        if (onProgress) onProgress(`Processing ${witnessData.length} items from witness_w_il.json...`);

        for (const item of witnessData) {
            const companyName = item.name || item.id;
            if (!companyName) continue;

            const normalized = normalizeName(companyName);
            const reason = item.reason || 'Supports Israel';
            const alternatives = Array.isArray(item.alternatives) ? item.alternatives : [];

            if (merged[normalized]) {
                // Merge existing
                if (!merged[normalized].supports) {
                    merged[normalized].supports = [];
                }
                if (!merged[normalized].supports.includes('Israel')) {
                    merged[normalized].supports.push('Israel');
                }
                // Merge alternatives
                if (alternatives.length > 0) {
                    if (!merged[normalized].alternatives) {
                        merged[normalized].alternatives = [];
                    }
                    for (const alt of alternatives) {
                        if (alt && !merged[normalized].alternatives!.includes(alt)) {
                            merged[normalized].alternatives!.push(alt);
                        }
                    }
                }
                // Merge reasons
                if (reason && reason !== 'Supports Israel') {
                    merged[normalized].reason = merged[normalized].reason
                        ? `${merged[normalized].reason}; ${reason}`
                        : reason;
                }
                totalMerged++;
            } else {
                // New company
                merged[normalized] = {
                    evil: true,
                    reason: reason,
                    alternatives: alternatives,
                    supports: ['Israel']
                };
                totalImported++;
            }
        }
        if (onProgress) onProgress(`Processed witness_w_il.json: ${totalImported} new, ${totalMerged} merged`);
    } catch (error) {
        console.error('Error loading witness_w_il.json:', error);
        if (onProgress) onProgress(`Warning: Could not load witness_w_il.json`);
    }

    // 2. Import from disoccupied_avoid.csv
    try {
        if (onProgress) onProgress('Loading disoccupied_avoid.csv...');
        const csvText = await fetchLocalFile(`${LOCAL_DATA_BASE}/disoccupied_avoid.csv`);
        const csvData = await parseDelimitedData(csvText, ',');

        if (onProgress) onProgress(`Processing ${csvData.length} items from disoccupied_avoid.csv...`);

        let csvImported = 0;
        let csvMerged = 0;

        for (const row of csvData) {
            const brandName = row.Brand || row.brand;
            const parentCompany = row.Parent || row.parent || row.Main || row.main;
            const reason = row['Why?'] || row.Why || row.reason || 'Supports Israel';
            const proof = row.Proof || row.proof || '';
            const alternatives = row.Alternatives ? row.Alternatives.split(',').map((a: string) => a.trim()).filter(Boolean) : [];

            // Use parent company if available, otherwise use brand
            const companyName = parentCompany || brandName;
            if (!companyName) continue;

            const normalized = normalizeName(companyName);
            const fullReason = proof ? `${reason} (${proof})` : reason;

            if (merged[normalized]) {
                // Merge existing
                if (!merged[normalized].supports) {
                    merged[normalized].supports = [];
                }
                if (!merged[normalized].supports.includes('Israel')) {
                    merged[normalized].supports.push('Israel');
                }
                // Merge alternatives
                if (alternatives.length > 0) {
                    if (!merged[normalized].alternatives) {
                        merged[normalized].alternatives = [];
                    }
                    for (const alt of alternatives) {
                        if (alt && !merged[normalized].alternatives!.includes(alt)) {
                            merged[normalized].alternatives!.push(alt);
                        }
                    }
                }
                csvMerged++;
            } else {
                // New company
                merged[normalized] = {
                    evil: true,
                    reason: fullReason,
                    alternatives: alternatives,
                    supports: ['Israel']
                };
                csvImported++;
            }

            // Also add brand as alias if parent company exists
            if (parentCompany && brandName && normalizeName(brandName) !== normalized) {
                // This would be handled by brand-aliases.json separately
            }
        }

        totalImported += csvImported;
        totalMerged += csvMerged;
        if (onProgress) onProgress(`Processed disoccupied_avoid.csv: ${csvImported} new, ${csvMerged} merged`);
    } catch (error) {
        console.error('Error loading disoccupied_avoid.csv:', error);
        if (onProgress) onProgress(`Warning: Could not load disoccupied_avoid.csv`);
    }

    // 3. Import from boycott_list_formatted.json
    try {
        if (onProgress) onProgress('Loading boycott_list_formatted.json...');
        const formattedText = await fetchLocalFile(`${LOCAL_DATA_BASE}/boycott_list_formatted.json`);
        const formattedData = JSON.parse(formattedText) as any[];

        if (onProgress) onProgress(`Processing ${formattedData.length} items from boycott_list_formatted.json...`);

        let formattedImported = 0;
        let formattedMerged = 0;

        for (const item of formattedData) {
            const companyName = item.attributes?.name;
            if (!companyName) continue;

            const normalized = normalizeName(companyName);
            const reason = item.attributes?.proof || 'Supports Israel';
            const proofUrl = item.attributes?.proofUrl || '';
            const alternatives = item.attributes?.alternative?.data 
                ? (Array.isArray(item.attributes.alternative.data) 
                    ? item.attributes.alternative.data.map((a: any) => a.attributes?.name).filter(Boolean)
                    : [item.attributes.alternative.data.attributes?.name].filter(Boolean))
                : [];

            const fullReason = proofUrl ? `${reason} (${proofUrl})` : reason;

            if (merged[normalized]) {
                // Merge existing
                if (!merged[normalized].supports) {
                    merged[normalized].supports = [];
                }
                if (!merged[normalized].supports.includes('Israel')) {
                    merged[normalized].supports.push('Israel');
                }
                // Merge alternatives
                if (alternatives.length > 0) {
                    if (!merged[normalized].alternatives) {
                        merged[normalized].alternatives = [];
                    }
                    for (const alt of alternatives) {
                        if (alt && !merged[normalized].alternatives!.includes(alt)) {
                            merged[normalized].alternatives!.push(alt);
                        }
                    }
                }
                formattedMerged++;
            } else {
                // New company
                merged[normalized] = {
                    evil: true,
                    reason: fullReason,
                    alternatives: alternatives,
                    supports: ['Israel']
                };
                formattedImported++;
            }
        }

        totalImported += formattedImported;
        totalMerged += formattedMerged;
        if (onProgress) onProgress(`Processed boycott_list_formatted.json: ${formattedImported} new, ${formattedMerged} merged`);
    } catch (error) {
        console.error('Error loading boycott_list_formatted.json:', error);
        if (onProgress) onProgress(`Warning: Could not load boycott_list_formatted.json`);
    }

    if (totalImported === 0 && totalMerged === 0) {
        throw new Error('Could not import any data from the boycott dataset files.');
    }

    if (onProgress) onProgress(`Import complete! Total: ${totalImported} new companies, ${totalMerged} merged with existing.`);
    
    return merged;
}

/**
 * Import brands as searchable products (synthetic entries for brands not in Open Food Facts)
 * Creates products with synthetic barcodes (format: "BRAND-{brandname}") so they're searchable
 */
export async function importBrandsAsProducts(
    onProgress?: (count: number, message?: string) => void
): Promise<number> {
    let totalImported = 0;

    // Import from witness_w_il.json
    try {
        if (onProgress) onProgress(0, 'Loading brands from witness_w_il.json...');
        const witnessText = await fetchLocalFile(`${LOCAL_DATA_BASE}/witness_w_il.json`);
        const witnessData = JSON.parse(witnessText) as any[];

        const products: Product[] = [];
        for (const item of witnessData) {
            const brandName = item.name || item.id;
            if (!brandName) continue;

            // Create synthetic barcode: "BRAND-{normalized-name}"
            const syntheticCode = `BRAND-${normalizeName(brandName).replace(/\s+/g, '-')}`;
            const productName = brandName;
            const brands = brandName;
            const normalizedBrand = normalizeName(brandName);

            products.push({
                code: syntheticCode,
                product_name: productName,
                brands: brands,
                normalized_brand: normalizedBrand,
                url: item.source || ''
            });
        }

        if (products.length > 0) {
            await db.products.bulkPut(products);
            totalImported += products.length;
            if (onProgress) onProgress(totalImported, `Imported ${products.length} brands from witness_w_il.json`);
        }
    } catch (error) {
        console.error('Error importing brands from witness_w_il.json:', error);
    }

    // Import from disoccupied_avoid.csv
    try {
        if (onProgress) onProgress(totalImported, 'Loading brands from disoccupied_avoid.csv...');
        const csvText = await fetchLocalFile(`${LOCAL_DATA_BASE}/disoccupied_avoid.csv`);
        const csvData = await parseDelimitedData(csvText, ',');

        const products: Product[] = [];
        const seenCodes = new Set<string>();

        for (const row of csvData) {
            const brandName = row.Brand || row.brand;
            if (!brandName) continue;

            const normalized = normalizeName(brandName);
            const syntheticCode = `BRAND-${normalized.replace(/\s+/g, '-')}`;

            // Skip if we already added this brand
            if (seenCodes.has(syntheticCode)) continue;
            seenCodes.add(syntheticCode);

            products.push({
                code: syntheticCode,
                product_name: brandName,
                brands: brandName,
                normalized_brand: normalized,
                url: row.Proof || ''
            });
        }

        if (products.length > 0) {
            await db.products.bulkPut(products);
            totalImported += products.length;
            if (onProgress) onProgress(totalImported, `Imported ${products.length} brands from disoccupied_avoid.csv`);
        }
    } catch (error) {
        console.error('Error importing brands from disoccupied_avoid.csv:', error);
    }

    // Import from boycott_list_formatted.json
    try {
        if (onProgress) onProgress(totalImported, 'Loading brands from boycott_list_formatted.json...');
        const formattedText = await fetchLocalFile(`${LOCAL_DATA_BASE}/boycott_list_formatted.json`);
        const formattedData = JSON.parse(formattedText) as any[];

        const products: Product[] = [];
        const seenCodes = new Set<string>();

        for (const item of formattedData) {
            const brandName = item.attributes?.name;
            if (!brandName) continue;

            const normalized = normalizeName(brandName);
            const syntheticCode = `BRAND-${normalized.replace(/\s+/g, '-')}`;

            // Skip if we already added this brand
            if (seenCodes.has(syntheticCode)) continue;
            seenCodes.add(syntheticCode);

            products.push({
                code: syntheticCode,
                product_name: brandName,
                brands: brandName,
                normalized_brand: normalized,
                url: item.attributes?.proofUrl || ''
            });
        }

        if (products.length > 0) {
            await db.products.bulkPut(products);
            totalImported += products.length;
            if (onProgress) onProgress(totalImported, `Imported ${products.length} brands from boycott_list_formatted.json`);
        }
    } catch (error) {
        console.error('Error importing brands from boycott_list_formatted.json:', error);
    }

    return totalImported;
}

/**
 * Generate brand aliases from the CSV (Brand -> Parent company mapping)
 */
export async function generateBrandAliases(): Promise<Record<string, string>> {
    const aliases: Record<string, string> = {};

    try {
        const csvText = await fetchLocalFile(`${LOCAL_DATA_BASE}/disoccupied_avoid.csv`);
        const csvData = await parseDelimitedData(csvText, ',');

        for (const row of csvData) {
            const brandName = row.Brand || row.brand;
            const parentCompany = row.Parent || row.parent || row.Main || row.main;

            if (brandName && parentCompany) {
                const normalizedBrand = normalizeName(brandName);
                const normalizedParent = normalizeName(parentCompany);
                
                // Only add if brand is different from parent
                if (normalizedBrand !== normalizedParent) {
                    aliases[normalizedBrand] = normalizedParent;
                }
            }
        }
    } catch (error) {
        console.error('Error generating brand aliases:', error);
    }

    return aliases;
}

/**
 * List available files in the local dataset directory
 */
export async function listAvailableFiles(): Promise<string[]> {
    const expectedFiles = [
        'witness_w_il.json',
        'disoccupied_avoid.csv',
        'boycott_list_formatted.json'
    ];

    const available: string[] = [];
    
    for (const file of expectedFiles) {
        try {
            const url = `${LOCAL_DATA_BASE}/${file}`;
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                available.push(file);
            }
        } catch (e) {
            // File doesn't exist
        }
    }

    return available;
}
