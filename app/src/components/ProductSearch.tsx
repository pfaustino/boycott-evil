import { useState, useEffect } from 'react';
import { type Product } from '../db';
import * as dataService from '../dataService';

interface Props {
    onSelect: (product: Product) => void;
}

export default function ProductSearch({ onSelect }: Props) {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (term.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                // Use data service for search (works with both Turso and IndexedDB)
                const found = await dataService.searchByQuery(term, 10);
                
                // Convert to Product type
                const products: Product[] = found.map(r => ({
                    code: r.code,
                    product_name: r.product_name,
                    brands: r.brands,
                    normalized_brand: r.normalized_brand,
                }));

                setResults(products);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(search, 300);
        return () => clearTimeout(timer);
    }, [term]);

    return (
        <div className="w-full max-w-md mx-auto">
            <label htmlFor="prod-search" className="block text-sm font-medium text-slate-700 mb-1">
                Product Name
            </label>
            <input
                id="prod-search"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Start typing..."
                className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-2 placeholder:text-slate-400"
            />

            {isSearching && <div className="text-sm text-slate-500">Searching...</div>}

            {results.length > 0 && (
                <ul className="bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100 mt-2 max-h-60 overflow-y-auto">
                    {results.map(prod => (
                        <li key={prod.code}>
                            <button
                                onClick={() => onSelect(prod)}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex justify-between items-center group"
                            >
                                <span className="font-medium text-slate-800">{prod.product_name}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full group-hover:bg-indigo-100 transition-colors">{prod.brands.split(',')[0]}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {term.length >= 2 && !isSearching && results.length === 0 && (
                <div className="text-sm text-slate-500 mt-2 px-1">No products found.</div>
            )}
        </div>
    );
}
