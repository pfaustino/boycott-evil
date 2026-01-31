import { useState, useEffect, useCallback } from 'react';
import { db, type Product } from '../db';
import { type EvilCompanies } from '../dataLoader';
import { getSupportBadgeStyle } from '../supportBadgeUtils';
import { isTursoConfigured } from '../dataService';

interface Props {
    evilCompanies: EvilCompanies;
    brandAliases: Record<string, string>;
    onClose: () => void;
    onSearch: (code: string) => void;
    initialTab?: 'products' | 'evil' | 'evil-products';
}

interface SelectedCompany {
    name: string;
    data: EvilCompanies[string];
}

export default function DatabaseBrowser({ evilCompanies, brandAliases, onClose, onSearch, initialTab = 'products' }: Props) {
    const usingTurso = isTursoConfigured();
    // Default to 'evil' tab when using Turso since product browsing isn't available
    const [activeTab, setActiveTab] = useState<'products' | 'evil' | 'evil-products'>(usingTurso ? 'evil' : initialTab);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(null);
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
        setSelectedCompany(null); // Clear selection on tab switch
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
                        {!usingTurso && (
                            <>
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
                            </>
                        )}
                        <button
                            onClick={() => setActiveTab('evil')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'evil' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            🚫 Boycott List ({Object.keys(evilCompanies).length})
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
                    ) : selectedCompany ? (
                        /* Detail View for Selected Company */
                        <div className="p-4">
                            <button 
                                onClick={() => setSelectedCompany(null)}
                                className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                ← Back to list
                            </button>
                            <div className={`p-6 rounded-xl border-2 ${selectedCompany.data.evil ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                                <h2 className="text-3xl font-bold text-slate-800 mb-2 capitalize">{selectedCompany.name}</h2>
                                
                                {selectedCompany.data.supports && (
                                    <div className="mb-6">
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedCompany.data.supports.map(support => {
                                                const style = getSupportBadgeStyle(support);
                                                return (
                                                    <span 
                                                        key={support} 
                                                        className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${style.bgColor} ${style.textColor}`}
                                                    >
                                                        {style.emoji} {style.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {/* Badge explanations */}
                                        <div className="bg-white/60 rounded-lg p-3 border border-red-100">
                                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Why boycott?</p>
                                            <ul className="space-y-1">
                                                {selectedCompany.data.supports.map(support => {
                                                    const style = getSupportBadgeStyle(support);
                                                    return (
                                                        <li key={support} className="text-sm text-slate-700 flex items-start gap-2">
                                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${style.bgColor} ${style.textColor}`}>
                                                                {style.emoji} {style.label}
                                                            </span>
                                                            <span className="text-slate-600">{style.description}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {selectedCompany.data.evil && (
                                    <div className="text-red-900">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-4xl">🚫</span>
                                            <span className="text-2xl font-bold">Boycott Recommended</span>
                                        </div>
                                        {selectedCompany.data.reason && (
                                            <div className="mb-4 text-lg leading-relaxed">
                                                <span className="font-bold">Reason:</span> {selectedCompany.data.reason}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedCompany.data.alternatives && selectedCompany.data.alternatives.length > 0 && (
                                    <div className="mt-6 p-4 bg-white/80 rounded-xl border border-emerald-200 shadow-sm">
                                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">✓ Better Alternatives</p>
                                        <ul className="space-y-2">
                                            {selectedCompany.data.alternatives.map(alt => (
                                                <li key={alt} className="flex items-center gap-2 text-emerald-700 font-medium">
                                                    <span className="text-emerald-500">✓</span> {alt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedCompany.data.citations && selectedCompany.data.citations.length > 0 && (
                                    <div className="mt-6 p-4 bg-white/80 rounded-xl border border-red-200 shadow-sm">
                                        <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">📚 Sources & Citations</p>
                                        <ul className="space-y-2">
                                            {selectedCompany.data.citations.map((citation, idx) => (
                                                <li key={idx} className="text-sm">
                                                    <a
                                                        href={citation.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                                    >
                                                        {citation.title || citation.source}
                                                    </a>
                                                    <span className="text-slate-500 ml-2">
                                                        — {citation.source}
                                                        {citation.date && <span className="text-slate-400"> ({citation.date})</span>}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Company List View */
                        <div className="p-4 grid gap-4">
                            {Object.entries(evilCompanies).map(([name, data]) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedCompany({ name, data })}
                                    className={`p-4 rounded-lg border flex flex-col gap-2 text-left transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${data.evil ? 'border-red-100 bg-red-50 hover:border-red-300' : 'border-slate-200 hover:border-slate-300'}`}
                                >
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
                                                            >
                                                                {style.emoji} {style.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {data.evil && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">EVIL</span>}
                                            <span className="text-slate-400 text-lg">→</span>
                                        </div>
                                    </div>
                                    {data.reason && <p className="text-sm text-slate-700 line-clamp-2"><span className="font-semibold">Reason:</span> {data.reason}</p>}
                                    {data.alternatives && data.alternatives.length > 0 && (
                                        <p className="text-sm text-slate-600"><span className="font-semibold">Alternatives:</span> {data.alternatives.join(', ')}</p>
                                    )}
                                </button>
                            ))}
                            {Object.keys(evilCompanies).length === 0 && (
                                <div className="text-center text-slate-400 p-8">No evil companies list loaded.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Pagination - only for local IndexedDB mode */}
                {!usingTurso && (activeTab === 'products' || activeTab === 'evil-products') && (
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
