import type { Product } from '../db';
import type { EvilCompanies } from '../dataLoader';
import { getSupportBadgeStyle } from '../supportBadgeUtils';

interface Props {
    product?: Product;
    evilStatus: 'evil' | 'clean' | 'unknown';
    companyData?: EvilCompanies[string];
    isLoading?: boolean;
}

export default function ResultDisplay({ product, evilStatus, companyData, isLoading }: Props) {
    if (isLoading) return <div className="mt-6 p-6 text-center text-slate-500 animate-pulse">Checking database...</div>;
    if (!product) return null;

    const isEvil = evilStatus === 'evil';
    const isClean = evilStatus === 'clean';

    return (
        <div className={`mt-6 p-6 rounded-xl shadow-lg border-2 transition-all duration-300 animate-in fade-in zoom-in-95 ${isEvil ? 'border-red-500 bg-red-50' :
            isClean ? 'border-green-500 bg-green-50' :
                'border-gray-200 bg-white'
            }`}>
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{product.product_name}</h2>
            <p className="text-slate-600 mb-4 text-lg">Brand: <span className="font-semibold text-slate-800">{product.brands}</span></p>

            {isEvil && companyData?.supports && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {companyData.supports.map(support => {
                        const style = getSupportBadgeStyle(support);
                        return (
                            <span 
                                key={support} 
                                className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${style.bgColor} ${style.textColor}`}
                                title={`Supports: ${style.label}`}
                            >
                                {style.emoji} {style.label}
                            </span>
                        );
                    })}
                </div>
            )}

            {isEvil && (
                <div className="text-red-900">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">🚫</span>
                        <span className="text-2xl font-bold">Boycott Recommended</span>
                    </div>
                    {companyData?.reason && (
                        <div className="mb-4 text-lg leading-relaxed">
                            <span className="font-bold">Reason:</span> {companyData.reason}
                        </div>
                    )}

                    {companyData?.alternatives && companyData.alternatives.length > 0 && (
                        <div className="mt-6 p-4 bg-white/80 rounded-xl border border-red-200 shadow-sm">
                            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Better Alternatives</p>
                            <ul className="grid gap-2">
                                {companyData.alternatives.map(alt => (
                                    <li key={alt} className="flex items-center gap-2 text-slate-800 font-medium">
                                        <span className="text-green-500">✓</span> {alt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {isClean && (
                <div className="text-green-900 flex items-center gap-3 mb-6">
                    <span className="text-4xl">✅</span>
                    <div>
                        <span className="text-2xl font-bold block">Company seems clear</span>
                        <span className="text-sm opacity-80">Not found in our boycott list</span>
                    </div>
                </div>
            )}

            {/* Product Metadata Section */}
            <div className={`pt-6 mt-6 border-t ${isEvil ? 'border-red-200' : isClean ? 'border-green-200' : 'border-slate-200'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isEvil ? 'text-red-400' : isClean ? 'text-green-600' : 'text-slate-400'}`}>
                    Product Data
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-slate-500 text-xs">Barcode</span>
                        <span className="font-mono font-medium text-slate-700">{product.code}</span>
                    </div>
                    {product.url ? (
                        <div>
                            <span className="block text-slate-500 text-xs">Source</span>
                            <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                                Open Food Facts ↗
                            </a>
                        </div>
                    ) : (
                        <div>
                            <span className="block text-slate-500 text-xs">Source</span>
                            <span className="text-slate-400 italic">No URL available</span>
                        </div>
                    )}
                </div>
            </div>

            {evilStatus === 'unknown' && (
                <div className="text-slate-600">
                    <p className="text-lg">No explicit data found for <span className="font-semibold">{product.normalized_brand || "this brand"}</span>.</p>
                </div>
            )}
        </div>
    );
}
