import Papa from 'papaparse';
import { db, type Product } from './db';

interface Citation {
    url: string;
    source: string;
    title?: string;
    date?: string;
}

interface EvilCompany {
    evil: boolean;
    reason?: string;
    alternatives?: string[];
    supports?: string[];
    citations?: Citation[];
}

export type EvilCompanies = Record<string, EvilCompany>;

export async function loadEvilCompanies(): Promise<EvilCompanies> {
    const response = await fetch('/evil-companies.json');
    if (!response.ok) {
        throw new Error('Failed to load evil companies list');
    }
    return await response.json();
}

export async function loadBrandAliases(): Promise<Record<string, string>> {
    try {
        const response = await fetch('/brand-aliases.json');
        if (!response.ok) return {};
        return await response.json();
    } catch (e) {
        console.warn("Failed to load aliases", e);
        return {};
    }
}

export async function loadProductData(onProgress?: (count: number) => void): Promise<void> {
    const count = await db.products.count();
    if (count > 0) {
        console.log('Data already loaded in IndexedDB');
        return;
    }

    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/off-mini.csv');
            if (!response.ok) {
                // Determine if we should fail or just resolve (maybe user deleted it)
                // for now, strict fail
                throw new Error(`CSV Fetch failed: ${response.statusText}`);
            }
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const products: Product[] = (results.data as any[]).map((row: any) => {
                        const code = row.code ? String(row.code).trim() : '';
                        const brands = row.brands || '';
                        const name = row.product_name || '';

                        if (!code) return null;

                        const firstBrand = brands.split(',')[0].trim().toLowerCase();
                        return {
                            code: code,
                            product_name: name,
                            brands: brands,
                            normalized_brand: firstBrand,
                            url: row.url || ''
                        } as Product;
                    }).filter((p): p is Product => p !== null);

                    if (products.length > 0) {
                        await db.products.bulkPut(products);
                        if (onProgress) onProgress(products.length);
                    }
                    console.log(`Parsed ${products.length} items from CSV`);
                    resolve();
                },
                error: (err: any) => {
                    reject(err);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

export async function loadLargeProductData(filePath: string = '/off-full.tsv', onProgress?: (count: number) => void): Promise<void> {
    // If DB has data, ask to clear first
    const count = await db.products.count();
    if (count > 0) {
        if (!confirm(`Database has ${count} items. Clear and load large dataset?`)) return;
        await clearData();
    }

    return new Promise((resolve, reject) => {
        let totalProcessed = 0;
        Papa.parse(filePath, {
            download: true,
            header: true,
            delimiter: '\t', // TSV
            skipEmptyLines: true,
            chunk: async (results, parser) => {
                parser.pause();
                try {
                    const products: Product[] = (results.data as any[]).map((row: any) => {
                        const code = row.code ? String(row.code).trim() : '';
                        if (!code) return null;

                        // Handle potential column variations or missing fields
                        const brands = row.brands || row.brands_tags || '';
                        const name = row.product_name || row.product_name_en || '';

                        if (!brands && !name) return null; // Skip empty rows

                        return {
                            code: code,
                            product_name: name,
                            brands: brands,
                            normalized_brand: brands.split(',')[0].trim().toLowerCase(),
                            url: row.url || ''
                        } as Product;
                    }).filter((p): p is Product => p !== null);

                    if (products.length > 0) {
                        await db.products.bulkPut(products);
                        totalProcessed += products.length;
                        if (onProgress) onProgress(totalProcessed);
                    }
                } catch (err) {
                    console.error("Chunk error", err);
                } finally {
                    parser.resume();
                }
            },
            complete: () => {
                console.log(`Large TSV processing complete. Total: ${totalProcessed}`);
                resolve();
            },
            error: (err: any) => {
                reject(err);
            }
        });
    });
}

export async function clearData(): Promise<void> {
    await db.products.clear();
    console.log('Database cleared');
}

/**
 * Save merged evil companies to a downloadable JSON file
 * Note: Browser security prevents direct file system writes,
 * so this returns the JSON string for download
 */
export function exportEvilCompanies(companies: EvilCompanies): string {
    return JSON.stringify(companies, null, 2);
}

/**
 * Merge evil companies data (for combining ICE and Israel boycott lists)
 */
export function mergeEvilCompanies(
    existing: EvilCompanies,
    newData: EvilCompanies
): EvilCompanies {
    const merged = { ...existing };
    
    for (const [key, value] of Object.entries(newData)) {
        const normalizedKey = key.toLowerCase();
        
        if (merged[normalizedKey]) {
            // Merge supports arrays
            if (value.supports) {
                if (!merged[normalizedKey].supports) {
                    merged[normalizedKey].supports = [];
                }
                for (const support of value.supports) {
                    if (!merged[normalizedKey].supports!.includes(support)) {
                        merged[normalizedKey].supports!.push(support);
                    }
                }
            }
            // Merge reasons
            if (value.reason && value.reason !== merged[normalizedKey].reason) {
                merged[normalizedKey].reason = merged[normalizedKey].reason
                    ? `${merged[normalizedKey].reason}; ${value.reason}`
                    : value.reason;
            }
            // Merge alternatives
            if (value.alternatives && value.alternatives.length > 0) {
                if (!merged[normalizedKey].alternatives) {
                    merged[normalizedKey].alternatives = [];
                }
                for (const alt of value.alternatives) {
                    if (!merged[normalizedKey].alternatives!.includes(alt)) {
                        merged[normalizedKey].alternatives!.push(alt);
                    }
                }
            }
        } else {
            // New company
            merged[normalizedKey] = { ...value };
        }
    }
    
    return merged;
}