import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import { type Product } from '../db';
import { type EvilCompanies, type GoodCompanies } from '../dataLoader';
import * as dataService from '../dataService';

interface SearchResult {
    type: 'product' | 'evil-company' | 'good-company';
    product?: Product;
    companyName?: string;
    companyData?: EvilCompanies[string];
    goodCompanyData?: GoodCompanies[string];
}

interface Props {
    onSelect: (product: Product) => void;
    evilCompanies?: EvilCompanies;
    goodCompanies?: GoodCompanies;
}

export default function ProductSearch({ onSelect, evilCompanies = {}, goodCompanies = {} }: Props) {
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
                const matchingEvilCompanies = Object.entries(evilCompanies)
                    .filter(([name]) => name.toLowerCase().includes(termLower))
                    .slice(0, 3);

                for (const [name, data] of matchingEvilCompanies) {
                    searchResults.push({
                        type: 'evil-company',
                        companyName: name,
                        companyData: data,
                    });
                }

                // 2. Search good companies list
                const matchingGoodCompanies = Object.entries(goodCompanies)
                    .filter(([name]) => name.toLowerCase().includes(termLower))
                    .slice(0, 3);

                for (const [name, data] of matchingGoodCompanies) {
                    searchResults.push({
                        type: 'good-company',
                        companyName: name,
                        goodCompanyData: data,
                    });
                }

                // 3. Search products database
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
    }, [term, evilCompanies, goodCompanies]);

    const handleEvilCompanySelect = (name: string, data: EvilCompanies[string]) => {
        track('name_search', { type: 'evil-company', name: name, supports: data.supports?.join(',') || '' });
        const syntheticProduct: Product = {
            code: `COMPANY-${name}`,
            product_name: name.charAt(0).toUpperCase() + name.slice(1),
            brands: name,
            normalized_brand: name.toLowerCase(),
        };
        onSelect(syntheticProduct);
    };

    const handleGoodCompanySelect = (name: string, data: GoodCompanies[string]) => {
        track('name_search', { type: 'good-company', name: name, supports: data.supports?.join(',') || '' });
        const syntheticProduct: Product = {
            code: `COMPANY-${name}`,
            product_name: name.charAt(0).toUpperCase() + name.slice(1),
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
                        <li key={result.type === 'product' ? result.product?.code || idx : `${result.type}-${result.companyName}`}>
                            {result.type === 'evil-company' && result.companyName && result.companyData ? (
                                <button
                                    onClick={() => handleEvilCompanySelect(result.companyName!, result.companyData!)}
                                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-medium text-slate-800 capitalize">{result.companyName}</span>
                                    <span className="text-xs text-white bg-red-500 px-2 py-1 rounded-full font-bold">
                                        🚫 Boycott
                                    </span>
                                </button>
                            ) : result.type === 'good-company' && result.companyName && result.goodCompanyData ? (
                                <button
                                    onClick={() => handleGoodCompanySelect(result.companyName!, result.goodCompanyData!)}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-medium text-slate-800 capitalize">{result.companyName}</span>
                                    <span className="text-xs text-white bg-emerald-500 px-2 py-1 rounded-full font-bold">
                                        ⭐ Recommended
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
