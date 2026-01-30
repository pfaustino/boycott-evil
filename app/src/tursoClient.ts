import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export interface TursoProduct {
    code: string;
    product_name: string;
    brands: string;
    normalized_brand: string;
}

export function initTursoClient(url: string, authToken: string): Client {
    client = createClient({
        url,
        authToken,
    });
    return client;
}

export function getTursoClient(): Client {
    if (!client) {
        // Check for environment variables
        const url = import.meta.env.VITE_TURSO_DATABASE_URL;
        const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;
        
        if (!url || !authToken) {
            throw new Error('Turso client not initialized. Set VITE_TURSO_DATABASE_URL and VITE_TURSO_AUTH_TOKEN environment variables.');
        }
        
        client = createClient({ url, authToken });
    }
    return client;
}

export interface ProductSearchResult {
    product: TursoProduct | null;
    matchType: 'exact' | 'prefix' | 'none';
    similarProducts?: TursoProduct[];  // Products from same manufacturer
    prefixLength?: number;  // How many digits matched
}

export async function searchProductByCode(code: string): Promise<TursoProduct | null> {
    const db = getTursoClient();
    const result = await db.execute({
        sql: 'SELECT code, product_name, brands, normalized_brand FROM products WHERE code = ?',
        args: [code],
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
        code: String(row.code),
        product_name: String(row.product_name || ''),
        brands: String(row.brands || ''),
        normalized_brand: String(row.normalized_brand || ''),
    };
}

/**
 * Smart barcode search with prefix matching fallback.
 * UPC/EAN codes have company prefixes in the first 6-10 digits.
 * If exact match fails, finds products from the same manufacturer.
 */
export async function searchProductByCodeSmart(code: string): Promise<ProductSearchResult> {
    const db = getTursoClient();
    
    // Normalize code - pad to 13 digits if needed
    const normalizedCode = code.padStart(13, '0');
    
    // 1. Try exact match first
    const exactResult = await db.execute({
        sql: 'SELECT code, product_name, brands, normalized_brand FROM products WHERE code = ? OR code = ?',
        args: [code, normalizedCode],
    });
    
    if (exactResult.rows.length > 0) {
        const row = exactResult.rows[0];
        return {
            product: {
                code: String(row.code),
                product_name: String(row.product_name || ''),
                brands: String(row.brands || ''),
                normalized_brand: String(row.normalized_brand || ''),
            },
            matchType: 'exact',
        };
    }
    
    // 2. Try prefix matching (company prefix is typically 6-10 digits)
    // Try progressively shorter prefixes: 10, 9, 8, 7, 6 digits
    for (const prefixLen of [10, 9, 8, 7, 6]) {
        if (normalizedCode.length < prefixLen) continue;
        
        const prefix = normalizedCode.substring(0, prefixLen);
        
        const prefixResult = await db.execute({
            sql: `SELECT code, product_name, brands, normalized_brand 
                  FROM products 
                  WHERE code LIKE ? 
                  LIMIT 5`,
            args: [`${prefix}%`],
        });
        
        if (prefixResult.rows.length > 0) {
            const products = prefixResult.rows.map(row => ({
                code: String(row.code),
                product_name: String(row.product_name || ''),
                brands: String(row.brands || ''),
                normalized_brand: String(row.normalized_brand || ''),
            }));
            
            return {
                product: products[0],  // Use first match as representative
                matchType: 'prefix',
                similarProducts: products,
                prefixLength: prefixLen,
            };
        }
    }
    
    // 3. No match found
    return {
        product: null,
        matchType: 'none',
    };
}

export async function searchProductsByName(query: string, limit = 20): Promise<TursoProduct[]> {
    const db = getTursoClient();
    const result = await db.execute({
        sql: `SELECT code, product_name, brands, normalized_brand 
              FROM products 
              WHERE product_name LIKE ? OR brands LIKE ?
              LIMIT ?`,
        args: [`%${query}%`, `%${query}%`, limit],
    });
    
    return result.rows.map(row => ({
        code: String(row.code),
        product_name: String(row.product_name || ''),
        brands: String(row.brands || ''),
        normalized_brand: String(row.normalized_brand || ''),
    }));
}

export async function searchProductsByBrand(brand: string, limit = 50): Promise<TursoProduct[]> {
    const db = getTursoClient();
    const normalizedBrand = brand.toLowerCase().trim();
    
    const result = await db.execute({
        sql: `SELECT code, product_name, brands, normalized_brand 
              FROM products 
              WHERE normalized_brand = ? OR normalized_brand LIKE ?
              LIMIT ?`,
        args: [normalizedBrand, `${normalizedBrand}%`, limit],
    });
    
    return result.rows.map(row => ({
        code: String(row.code),
        product_name: String(row.product_name || ''),
        brands: String(row.brands || ''),
        normalized_brand: String(row.normalized_brand || ''),
    }));
}

export async function getProductCount(): Promise<number> {
    const db = getTursoClient();
    const result = await db.execute('SELECT COUNT(*) as count FROM products');
    return Number(result.rows[0].count);
}

export async function testConnection(): Promise<boolean> {
    try {
        const db = getTursoClient();
        await db.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Turso connection test failed:', error);
        return false;
    }
}
