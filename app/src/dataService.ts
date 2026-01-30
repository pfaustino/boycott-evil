/**
 * Data Service - Abstracts data source (IndexedDB vs Turso)
 * 
 * If VITE_TURSO_DATABASE_URL is set, uses Turso cloud database.
 * Otherwise, falls back to local IndexedDB.
 */

import { db } from './db';
import * as turso from './tursoClient';

export interface ProductResult {
    code: string;
    product_name: string;
    brands: string;
    normalized_brand: string;
}

export interface SmartSearchResult {
    product: ProductResult | null;
    matchType: 'exact' | 'prefix' | 'none';
    similarProducts?: ProductResult[];
    prefixLength?: number;
}

// Check if Turso is configured
export function isTursoConfigured(): boolean {
    return !!(import.meta.env.VITE_TURSO_DATABASE_URL && import.meta.env.VITE_TURSO_AUTH_TOKEN);
}

export function getDataSourceName(): string {
    return isTursoConfigured() ? 'Turso Cloud' : 'Local IndexedDB';
}

/**
 * Search for a product by barcode
 */
export async function searchByCode(code: string): Promise<ProductResult | null> {
    if (isTursoConfigured()) {
        return await turso.searchProductByCode(code);
    }
    
    // Local IndexedDB
    const product = await db.products.get(code);
    if (!product) return null;
    
    return {
        code: product.code,
        product_name: product.product_name,
        brands: product.brands,
        normalized_brand: product.normalized_brand || '',
    };
}

/**
 * Smart barcode search with prefix matching fallback.
 * If exact match fails, finds products from the same manufacturer
 * by matching the company prefix (first 6-10 digits).
 */
export async function searchByCodeSmart(code: string): Promise<SmartSearchResult> {
    if (isTursoConfigured()) {
        return await turso.searchProductByCodeSmart(code);
    }
    
    // Local IndexedDB - exact match only (no prefix search implemented)
    const product = await db.products.get(code);
    if (product) {
        return {
            product: {
                code: product.code,
                product_name: product.product_name,
                brands: product.brands,
                normalized_brand: product.normalized_brand || '',
            },
            matchType: 'exact',
        };
    }
    
    // Try padded code
    const paddedCode = code.padStart(13, '0');
    const paddedProduct = await db.products.get(paddedCode);
    if (paddedProduct) {
        return {
            product: {
                code: paddedProduct.code,
                product_name: paddedProduct.product_name,
                brands: paddedProduct.brands,
                normalized_brand: paddedProduct.normalized_brand || '',
            },
            matchType: 'exact',
        };
    }
    
    return { product: null, matchType: 'none' };
}

/**
 * Search products by name or brand
 */
export async function searchByQuery(query: string, limit = 20): Promise<ProductResult[]> {
    if (isTursoConfigured()) {
        return await turso.searchProductsByName(query, limit);
    }
    
    // Local IndexedDB - search by name
    const queryLower = query.toLowerCase();
    const results = await db.products
        .filter(p => 
            p.product_name.toLowerCase().includes(queryLower) ||
            p.brands.toLowerCase().includes(queryLower)
        )
        .limit(limit)
        .toArray();
    
    return results.map(p => ({
        code: p.code,
        product_name: p.product_name,
        brands: p.brands,
        normalized_brand: p.normalized_brand || '',
    }));
}

/**
 * Search products by brand name
 */
export async function searchByBrand(brand: string, limit = 50): Promise<ProductResult[]> {
    if (isTursoConfigured()) {
        return await turso.searchProductsByBrand(brand, limit);
    }
    
    // Local IndexedDB
    const normalizedBrand = brand.toLowerCase().trim();
    const results = await db.products
        .where('normalized_brand')
        .equals(normalizedBrand)
        .limit(limit)
        .toArray();
    
    return results.map(p => ({
        code: p.code,
        product_name: p.product_name,
        brands: p.brands,
        normalized_brand: p.normalized_brand || '',
    }));
}

/**
 * Get total product count
 */
export async function getProductCount(): Promise<number> {
    if (isTursoConfigured()) {
        return await turso.getProductCount();
    }
    
    return await db.products.count();
}

/**
 * Initialize the data source
 * - For Turso: test connection
 * - For IndexedDB: load data from CSV if empty
 */
export async function initializeDataSource(onProgress?: (count: number) => void): Promise<void> {
    if (isTursoConfigured()) {
        // Test Turso connection
        const connected = await turso.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to Turso database');
        }
        console.log('Connected to Turso database');
        return;
    }
    
    // Local IndexedDB - load data if not present
    const { loadProductData } = await import('./dataLoader');
    await loadProductData(onProgress);
}

/**
 * Check if data is available
 */
export async function isDataAvailable(): Promise<boolean> {
    try {
        const count = await getProductCount();
        return count > 0;
    } catch {
        return false;
    }
}
