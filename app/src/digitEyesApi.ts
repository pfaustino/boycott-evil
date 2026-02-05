/**
 * Digit-Eyes UPC API Integration
 * 
 * Fallback API for products not found in our database.
 * 
 * API Documentation: https://www.digit-eyes.com/specs/UPCAPIImplementation.pdf
 * 
 * Usage:
 * - Only called when product is NOT found in our database
 * - Requires API key (set in environment variable)
 * - Rate limits may apply - check Digit-Eyes pricing
 */

export interface DigitEyesProduct {
    description: string;
    brand: string;
    upc: string;
    message?: string;
}

/**
 * Lookup product by UPC using Digit-Eyes API
 * 
 * @param upc - Barcode/UPC to lookup
 * @returns Product info or null if not found/error
 */
export async function lookupProductByUPC(upc: string): Promise<DigitEyesProduct | null> {
    const apiKey = import.meta.env.VITE_DIGITEYES_API_KEY;
    
    if (!apiKey) {
        console.log('Digit-Eyes API key not configured');
        return null;
    }

    try {
        // Normalize UPC (remove spaces, ensure proper length)
        const normalizedUPC = upc.replace(/\s/g, '').padStart(13, '0');
        
        // Digit-Eyes API endpoint (check their docs for exact URL)
        // Typical format: https://www.digit-eyes.com/gtin/v2_0/?upcCode={upc}&field_names=description,brand&language=en&app_key={key}
        const url = `https://www.digit-eyes.com/gtin/v2_0/?upcCode=${normalizedUPC}&field_names=description,brand&language=en&app_key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`Digit-Eyes API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        // Check if product was found
        if (data.message && data.message.toLowerCase().includes('not found')) {
            return null;
        }

        // Extract product info
        return {
            description: data.description || '',
            brand: data.brand || '',
            upc: normalizedUPC,
            message: data.message,
        };
    } catch (error) {
        console.error('Digit-Eyes API lookup failed:', error);
        return null;
    }
}

/**
 * Convert Digit-Eyes product to our Product format
 */
export function digitEyesToProduct(digitEyesProduct: DigitEyesProduct): {
    code: string;
    product_name: string;
    brands: string;
    normalized_brand: string;
} {
    const brand = digitEyesProduct.brand || '';
    const normalizedBrand = brand.toLowerCase().trim();
    
    return {
        code: digitEyesProduct.upc,
        product_name: digitEyesProduct.description || 'Product from Digit-Eyes',
        brands: brand,
        normalized_brand: normalizedBrand,
    };
}
