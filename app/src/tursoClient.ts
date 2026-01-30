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
