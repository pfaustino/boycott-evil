import Papa from 'papaparse';
import { db, type Product } from './db';

interface EvilCompany {
    evil: boolean;
    reason?: string;
    alternatives?: string[];
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
                            normalized_brand: firstBrand
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
                            normalized_brand: brands.split(',')[0].trim().toLowerCase()
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
