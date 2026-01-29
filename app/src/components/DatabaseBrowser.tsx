import { useState, useEffect, useCallback } from 'react';
import { db, type Product } from '../db';
import { type EvilCompanies } from '../dataLoader';
import { getSupportBadgeStyle } from '../supportBadgeUtils';

interface Props {
    evilCompanies: EvilCompanies;
    brandAliases: Record<string, string>;
    onClose: () => void;
    onSearch: (code: string) => void;
    initialTab?: 'products' | 'evil' | 'evil-products';
}

export default function DatabaseBrowser({ evilCompanies, brandAliases, onClose, onSearch, initialTab = 'products' }: Props) {
    const [activeTab, setActiveTab] = useState<'products' | 'evil' | 'evil-products'>(initialTab);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const pageSize = 50;

    // Compute set of all brands considered evil (direct + aliases)
    const getEvilBrands = useCallback(() => {
        const directEvil = Object.keys(evilCompanies).filter(b => evilCompanies[b].evil).map(b => b.toLowerCase());
        const aliasEvil = Object.keys(brandAliases).filter(alias => {
            const parent = brandAliases[alias];
            return evilCompanies[parent.toLowerCase()]?.evil;
        }).map(a => a.toLowerCase());
        // remove duplicates
        return Array.from(new Set([...directEvil, ...aliasEvil]));
    }, [evilCompanies, brandAliases]);

    useEffect(() => {
        setPage(0); // Reset page on tab switch
    }, [activeTab]);

    const loadAllProducts = useCallback(async () => {
        const count = await db.products.count();
        setTotalProducts(count);
        const chunk = await db.products.offset(page * pageSize).limit(pageSize).toArray();
        setProducts(chunk);
    }, [page, pageSize]);

    const loadEvilProducts = useCallback(async () => {
        const evilBrands = getEvilBrands();
        console.log("Filtering for brands:", evilBrands);

        // Dexie .offset() doesn't work reliably with .anyOf(), so we fetch all matches
        // and paginate in memory. Since evil products are a subset, this is safe (usually <10k items).
        const allMatches = await db.products.where('normalized_brand').anyOf(evilBrands).toArray();

        console.log("Found matches total:", allMatches.length);
        setTotalProducts(allMatches.length);

        const start = page * pageSize;
        const chunk = allMatches.slice(start, start + pageSize);
        console.log("Sliced chunk:", chunk);
        try {
            setProducts(chunk);
        } catch (e) {
            console.error("Error setting products", e);
        }
    }, [page, pageSize, getEvilBrands]);

    useEffect(() => {
        if (activeTab === 'products') {
            loadAllProducts();
        } else if (activeTab === 'evil-products') {
            loadEvilProducts();
        }
    }, [activeTab, page, loadAllProducts, loadEvilProducts]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            All Products
                        </button>
                        <button
                            onClick={() => setActiveTab('evil-products')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'evil-products' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            Matches Evil List
                        </button>
                        <button
                            onClick={() => setActiveTab('evil')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'evil' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            Evil Companies Rule Set
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-0">
                    {(activeTab === 'products' || activeTab === 'evil-products') ? (
                        <div className="min-w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Code</th>
                                        <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Product Name</th>
                                        <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Brand(s)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map(p => (
                                        <tr key={p.code} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-xs text-slate-500">
                                                <button onClick={() => onSearch(p.code)} className="text-indigo-600 hover:underline text-left">
                                                    {p.code}
                                                </button>
                                            </td>
                                            <td className="p-3 text-sm text-slate-800 font-medium">
                                                {p.url ? (
                                                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">
                                                        {p.product_name} ↗
                                                    </a>
                                                ) : (
                                                    p.product_name
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-slate-600">{p.brands}</td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400">No products found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 grid gap-4">
                            {Object.entries(evilCompanies).map(([name, data]) => (
                                <div key={name} className={`p-4 rounded-lg border flex flex-col gap-2 ${data.evil ? 'border-red-100 bg-red-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-lg capitalize text-slate-800">{name}</h3>
                                            {data.supports && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {data.supports.map(c => {
                                                        const style = getSupportBadgeStyle(c);
                                                        return (
                                                            <span 
                                                                key={c} 
                                                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${style.bgColor} ${style.textColor}`}
                                                                title={`Supports: ${style.label}`}
                                                            >
                                                                {style.emoji} {style.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {data.evil && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">EVIL</span>}
                                    </div>
                                    {data.reason && <p className="text-sm text-slate-700"><span className="font-semibold">Reason:</span> {data.reason}</p>}
                                    {data.alternatives && data.alternatives.length > 0 && (
                                        <p className="text-sm text-slate-600"><span className="font-semibold">Alternatives:</span> {data.alternatives.join(', ')}</p>
                                    )}
                                </div>
                            ))}
                            {Object.keys(evilCompanies).length === 0 && (
                                <div className="text-center text-slate-400 p-8">No evil companies list loaded.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                {(activeTab === 'products' || activeTab === 'evil-products') && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="px-4 py-2 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            Page {page + 1} of {Math.max(1, Math.ceil(totalProducts / pageSize))} ({totalProducts.toLocaleString()} items)
                        </span>
                        <button
                            disabled={(page + 1) * pageSize >= totalProducts}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
