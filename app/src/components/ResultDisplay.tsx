import type { Product } from '../db';
import type { EvilCompanies, GoodCompanies } from '../dataLoader';
import { getSupportBadgeStyle } from '../supportBadgeUtils';

interface MatchInfo {
    type: 'exact' | 'prefix' | 'none';
    prefixLength?: number;
    similarProducts?: Product[];
    source?: 'database' | 'digit-eyes';
}

interface Props {
    product?: Product;
    evilStatus: 'evil' | 'clean' | 'good' | 'unknown';
    companyData?: EvilCompanies[string];
    goodCompanyData?: GoodCompanies[string];
    isLoading?: boolean;
    matchInfo?: MatchInfo;
}

export default function ResultDisplay({ product, evilStatus, companyData, goodCompanyData, isLoading, matchInfo }: Props) {
    if (isLoading) return <div className="mt-6 p-6 text-center text-slate-500 animate-pulse">Checking database...</div>;
    
    // Show "not found" message when matchInfo indicates no match
    if (matchInfo?.type === 'none') {
        return (
            <div className="mt-6 p-6 rounded-xl shadow-lg border-2 border-amber-300 bg-amber-50">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">🔍</span>
                    <div>
                        <span className="text-2xl font-bold text-amber-800 block">Product Not Found</span>
                        <span className="text-amber-700">Not in our database of 356K+ products</span>
                    </div>
                </div>
                <p className="text-amber-800 text-sm">
                    Try searching by product name instead, or the product may not be in our Open Food Facts dataset.
                </p>
            </div>
        );
    }
    
    if (!product) return null;

    const isEvil = evilStatus === 'evil';
    const isGood = evilStatus === 'good';
    const isClean = evilStatus === 'clean';

    return (
        <div className={`mt-6 p-6 rounded-xl shadow-lg border-2 transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isEvil ? 'border-red-500 bg-red-50' :
            isGood ? 'border-emerald-500 bg-emerald-50' :
            isClean ? 'border-green-500 bg-green-50' :
            'border-gray-200 bg-white'
        }`}>
            
            {/* Prefix match indicator */}
            {matchInfo?.type === 'prefix' && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm">
                    <span className="font-bold">🔗 Manufacturer Match:</span> Exact product not found, but we found other products from the same company 
                    (matching first {matchInfo.prefixLength} digits of barcode).
                </div>
            )}
            
            {/* Digit-Eyes API indicator */}
            {matchInfo?.source === 'digit-eyes' && (
                <div className="mb-4 p-3 bg-indigo-100 border border-indigo-300 rounded-lg text-indigo-800 text-sm">
                    <span className="font-bold">🌐 External Database:</span> Product not in our database, but found via Digit-Eyes UPC lookup.
                </div>
            )}
            
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{product.product_name}</h2>
            <p className="text-slate-600 mb-4 text-lg">Brand: <span className="font-semibold text-slate-800">{product.brands}</span></p>

            {isEvil && companyData?.supports && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {companyData.supports.map(support => {
                            const style = getSupportBadgeStyle(support);
                            return (
                                <span 
                                    key={support} 
                                    className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${style.bgColor} ${style.textColor}`}
                                    title={style.description}
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
                            {companyData.supports.map(support => {
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

                    {companyData?.citations && companyData.citations.length > 0 && (
                        <div className="mt-6 p-4 bg-white/80 rounded-xl border border-red-200 shadow-sm">
                            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">📚 Sources & Citations</p>
                            <ul className="space-y-2">
                                {companyData.citations.map((citation, idx) => (
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
            )}

            {isGood && (
                <div className="text-emerald-900">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {goodCompanyData?.supports?.map(support => {
                            const style = getSupportBadgeStyle(support);
                            return (
                                <span 
                                    key={support} 
                                    className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${style.bgColor} ${style.textColor}`}
                                    title={style.label}
                                >
                                    {style.emoji} {style.label}
                                </span>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">⭐</span>
                        <span className="text-2xl font-bold">Recommended Company</span>
                    </div>
                    {goodCompanyData?.reason && (
                        <div className="mb-4 text-lg leading-relaxed">
                            <span className="font-bold">Why:</span> {goodCompanyData.reason}
                        </div>
                    )}
                    {goodCompanyData?.category && (
                        <div className="mb-4 text-sm text-emerald-700">
                            <span className="font-semibold">Category:</span> {goodCompanyData.category}
                        </div>
                    )}
                    {goodCompanyData?.citations && goodCompanyData.citations.length > 0 && (
                        <div className="mt-6 p-4 bg-white/80 rounded-xl border border-emerald-200 shadow-sm">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">📚 Sources</p>
                            <ul className="space-y-2">
                                {goodCompanyData.citations.map((citation, idx) => (
                                    <li key={idx} className="text-sm">
                                        <a 
                                            href={citation.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                        >
                                            {citation.title || citation.source}
                                        </a>
                                        <span className="text-slate-500 ml-2">— {citation.source}</span>
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
            <div className={`pt-6 mt-6 border-t ${isEvil ? 'border-red-200' : isGood ? 'border-emerald-200' : isClean ? 'border-green-200' : 'border-slate-200'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isEvil ? 'text-red-400' : isGood ? 'text-emerald-600' : isClean ? 'text-green-600' : 'text-slate-400'}`}>
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

            {/* Similar products from prefix match */}
            {matchInfo?.type === 'prefix' && matchInfo.similarProducts && matchInfo.similarProducts.length > 1 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Other Products from Same Manufacturer
                    </h4>
                    <ul className="space-y-2 text-sm">
                        {matchInfo.similarProducts.slice(0, 5).map(p => (
                            <li key={p.code} className="flex items-center gap-2 text-slate-600">
                                <span className="text-slate-400 font-mono text-xs">{p.code}</span>
                                <span>{p.product_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
