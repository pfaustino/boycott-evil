import { useState, useEffect } from 'react';
import { db, type Product } from '../db';
import { type EvilCompanies } from '../dataLoader';

interface Props {
    evilCompanies: EvilCompanies;
    onClose: () => void;
    initialTab?: 'products' | 'evil';
}

export default function DatabaseBrowser({ evilCompanies, onClose, initialTab = 'products' }: Props) {
    const [activeTab, setActiveTab] = useState<'products' | 'evil'>(initialTab);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const pageSize = 50;

    useEffect(() => {
        if (activeTab === 'products') {
            loadProducts();
        }
    }, [activeTab, page]);

    async function loadProducts() {
        const count = await db.products.count();
        setTotalProducts(count);
        const chunk = await db.products.offset(page * pageSize).limit(pageSize).toArray();
        setProducts(chunk);
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'products' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            Products DB ({totalProducts.toLocaleString()})
                        </button>
                        <button
                            onClick={() => setActiveTab('evil')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'evil' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            Evil Companies ({Object.keys(evilCompanies).length})
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-0">
                    {activeTab === 'products' ? (
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
                                            <td className="p-3 font-mono text-xs text-slate-500">{p.code}</td>
                                            <td className="p-3 text-sm text-slate-800 font-medium">{p.product_name}</td>
                                            <td className="p-3 text-sm text-slate-600">{p.brands}</td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400">No products found. Load data first.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 grid gap-4">
                            {Object.entries(evilCompanies).map(([name, data]) => (
                                <div key={name} className={`p-4 rounded-lg border flex flex-col gap-2 ${data.evil ? 'border-red-100 bg-red-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg capitalize text-slate-800">{name}</h3>
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
                {activeTab === 'products' && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="px-4 py-2 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            Page {page + 1} of {Math.ceil(totalProducts / pageSize)}
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
