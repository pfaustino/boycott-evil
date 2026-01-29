import { useState, useEffect } from 'react';
import { db, type Product } from './db';
import { loadProductData, loadLargeProductData, loadEvilCompanies, loadBrandAliases, clearData, type EvilCompanies } from './dataLoader';
import BarcodeSearch from './components/BarcodeSearch';
import ProductSearch from './components/ProductSearch';
import ResultDisplay from './components/ResultDisplay';
import DatabaseBrowser from './components/DatabaseBrowser';

function App() {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [evilCompanies, setEvilCompanies] = useState<EvilCompanies>({});
  const [brandAliases, setBrandAliases] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<'barcode' | 'product'>('barcode');
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserTab, setBrowserTab] = useState<'products' | 'evil'>('products');

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [evilStatus, setEvilStatus] = useState<'evil' | 'clean' | 'unknown'>('unknown');
  const [companyData, setCompanyData] = useState<EvilCompanies[string] | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          loadProductData((count) => setLoadProgress(count)),
          loadProductData((count) => setLoadProgress(count)),
          loadEvilCompanies().then(setEvilCompanies),
          loadBrandAliases().then(setBrandAliases)
        ]);
        setLoading(false);
      } catch (err) {
        console.error("Init failed", err);
        setLoading(false); // To show UI even if fail? Or show error.
      }
    }
    init();
  }, []);

  const checkCompliance = (product: Product) => {
    setSelectedProduct(product);
    setSearchLoading(true); // Artificial delay or just state transition
    setCompanyData(undefined);

    // Normalize logic
    const brand = product.normalized_brand;

    // Wait a tick for UI
    setTimeout(() => {
      if (!brand) {
        setEvilStatus('unknown');
        setSearchLoading(false);
        return;
      }

      const info = evilCompanies[brand];
      if (info && info.evil) {
        setEvilStatus('evil');
        setCompanyData(info);
      } else {
        // Check aliases
        const parentCompany = brandAliases[brand];
        if (parentCompany && evilCompanies[parentCompany.toLowerCase()] && evilCompanies[parentCompany.toLowerCase()].evil) {
          setEvilStatus('evil');
          setCompanyData(evilCompanies[parentCompany.toLowerCase()]);
        } else {
          setEvilStatus('clean');
        }
      }
      setSearchLoading(false);
    }, 100);
  };

  const handleBarcodeSearch = async (code: string) => {
    setSearchLoading(true);
    setSelectedProduct(undefined);
    try {
      const product = await db.products.get(code);
      if (product) {
        checkCompliance(product);
      } else {
        alert("Product not found via barcode."); // Replace with better UI later
        setSearchLoading(false);
      }
    } catch (err) {
      console.error(err);
      setSearchLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm("This will clear the database and reload from CSV. Continue?")) return;
    setLoading(true);
    try {
      let countLoaded = 0;
      await clearData();
      await loadProductData((count) => {
        setLoadProgress(count);
        countLoaded = count;
      });
      alert(`Data debug reset complete. Loaded ${countLoaded} items.`);
    } catch (err) {
      alert("Reset failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFullData = async () => {
    if (!confirm("Load the FULL Open Food Facts dataset? This may take several minutes.")) return;
    setLoading(true);
    try {
      // No need to clearData here if loadLargeProductData handles it, 
      // but we might want to be explicit. loadLargeProductData confirms internally.
      // Let's rely on its internal confirm for clearing.
      let countLoaded = 0;
      await loadLargeProductData('/off-full.tsv', (count) => {
        setLoadProgress(count);
        countLoaded = count;
      });
      alert(`Full dataset loaded! ${countLoaded} items processed.`);
    } catch (err) {
      alert("Full load failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-2xl font-bold mb-4 animate-pulse">Initializing Database...</div>
        <div>Processed items: {loadProgress}</div>
        <div className="text-sm mt-2 text-slate-400">First load only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">Boycott Evil</h1>
          <p className="text-slate-500 text-lg">Scan. Check. Act.</p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('barcode'); setSelectedProduct(undefined); }}
              className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'barcode' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Barcode
            </button>
            <button
              onClick={() => { setActiveTab('product'); setSelectedProduct(undefined); }}
              className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'product' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Product Name
            </button>
          </div>

          <div className="p-8 min-h-[400px]">
            {activeTab === 'barcode' ? (
              <BarcodeSearch onSearch={handleBarcodeSearch} isLoading={searchLoading} />
            ) : (
              <ProductSearch onSelect={checkCompliance} />
            )}

            <ResultDisplay
              product={selectedProduct}
              evilStatus={evilStatus}
              companyData={companyData}
              isLoading={searchLoading} // pass loading to let Result handle it if needed
            />
          </div>
        </main>

        <footer className="text-center mt-10 text-slate-400 text-sm pb-10">
          <p>Powered by Open Food Facts & Community Data</p>
          <button
            onClick={handleResetData}
            className="mt-4 text-xs underline opacity-50 hover:opacity-100"
          >
            Debug: Reset Data
          </button>
          <span className="mx-2 text-slate-300">|</span>
          <button
            onClick={handleLoadFullData}
            className="mt-4 text-xs underline opacity-50 hover:opacity-100 text-indigo-600"
          >
            Load Full DB (1GB)
          </button>

          <div className="mt-6 pt-6 border-t border-slate-200/50 flex justify-center gap-6">
            <button
              onClick={() => { setBrowserTab('products'); setShowBrowser(true); }}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
            >
              Browse Products
            </button>
            <button
              onClick={() => { setBrowserTab('evil'); setShowBrowser(true); }}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
            >
              Browse Evil List
            </button>
          </div>
        </footer>
      </div>

      {showBrowser && (
        <DatabaseBrowser
          evilCompanies={evilCompanies}
          initialTab={browserTab}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}

export default App;
