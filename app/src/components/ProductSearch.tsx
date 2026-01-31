import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import { type Product } from '../db';
import { type EvilCompanies } from '../dataLoader';
import * as dataService from '../dataService';

interface SearchResult {
    type: 'product' | 'company';
    product?: Product;
    companyName?: string;
    companyData?: EvilCompanies[string];
}

interface Props {
    onSelect: (product: Product) => void;
    evilCompanies?: EvilCompanies;
}

export default function ProductSearch({ onSelect, evilCompanies = {} }: Props) {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (term.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const searchResults: SearchResult[] = [];
                const termLower = term.toLowerCase();

                // 1. Search evil companies list first
                const matchingCompanies = Object.entries(evilCompanies)
                    .filter(([name]) => name.toLowerCase().includes(termLower))
                    .slice(0, 5);

                for (const [name, data] of matchingCompanies) {
                    searchResults.push({
                        type: 'company',
                        companyName: name,
                        companyData: data,
                    });
                }

                // 2. Search products database
                const found = await dataService.searchByQuery(term, 10 - searchResults.length);
                
                for (const r of found) {
                    searchResults.push({
                        type: 'product',
                        product: {
                            code: r.code,
                            product_name: r.product_name,
                            brands: r.brands,
                            normalized_brand: r.normalized_brand,
                        },
                    });
                }

                setResults(searchResults);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(search, 300);
        return () => clearTimeout(timer);
    }, [term, evilCompanies]);

    const handleCompanySelect = (name: string, data: EvilCompanies[string]) => {
        // Track the company search
        track('name_search', { type: 'company', name: name, supports: data.supports?.join(',') || '' });
        
        // Create a synthetic product for the company
        const syntheticProduct: Product = {
            code: `COMPANY-${name}`,
            product_name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
            brands: name,
            normalized_brand: name.toLowerCase(),
        };
        onSelect(syntheticProduct);
    };

    const handleProductSelect = (product: Product) => {
        track('name_search', { type: 'product', name: product.product_name, brand: product.brands });
        onSelect(product);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <label htmlFor="prod-search" className="block text-sm font-medium text-slate-700 mb-1">
                Company or Product Name
            </label>
            <input
                id="prod-search"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. Nestle, Palantir, KitKat..."
                className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-2 placeholder:text-slate-400"
            />

            {isSearching && <div className="text-sm text-slate-500">Searching...</div>}

            {results.length > 0 && (
                <ul className="bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100 mt-2 max-h-72 overflow-y-auto">
                    {results.map((result, idx) => (
                        <li key={result.type === 'company' ? `company-${result.companyName}` : result.product?.code || idx}>
                            {result.type === 'company' && result.companyName && result.companyData ? (
                                <button
                                    onClick={() => handleCompanySelect(result.companyName!, result.companyData!)}
                                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-medium text-slate-800 capitalize">{result.companyName}</span>
                                    <span className="text-xs text-white bg-red-500 px-2 py-1 rounded-full font-bold">
                                        🚫 Boycott
                                    </span>
                                </button>
                            ) : result.product ? (
                                <button
                                    onClick={() => handleProductSelect(result.product!)}
                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-medium text-slate-800">{result.product.product_name}</span>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full group-hover:bg-indigo-100 transition-colors">
                                        {result.product.brands.split(',')[0]}
                                    </span>
                                </button>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}

            {term.length >= 2 && !isSearching && results.length === 0 && (
                <div className="text-sm text-slate-500 mt-2 px-1">No companies or products found.</div>
            )}
        </div>
    );
}
