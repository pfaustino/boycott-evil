import { useState, useEffect } from 'react';
import { db, type Product } from './db';
import { loadProductData, loadLargeProductData, loadEvilCompanies, loadBrandAliases, clearData, exportEvilCompanies, type EvilCompanies } from './dataLoader';
import { importBoycottCompanies, importBrandsAsProducts, generateBrandAliases, listAvailableFiles } from './githubImporter';
import * as dataService from './dataService';
import BarcodeSearch from './components/BarcodeSearch';
import ProductSearch from './components/ProductSearch';
import ResultDisplay from './components/ResultDisplay';
import DatabaseBrowser from './components/DatabaseBrowser';

function App() {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [evilCompanies, setEvilCompanies] = useState<EvilCompanies>({});
  const [brandAliases, setBrandAliases] = useState<Record<string, string>>({});
  const [productCount, setProductCount] = useState(0);

  const [activeTab, setActiveTab] = useState<'barcode' | 'product'>('barcode');
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserTab, setBrowserTab] = useState<'products' | 'evil' | 'evil-products'>('products');

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [evilStatus, setEvilStatus] = useState<'evil' | 'clean' | 'unknown'>('unknown');
  const [companyData, setCompanyData] = useState<EvilCompanies[string] | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');
  const [matchInfo, setMatchInfo] = useState<{ type: 'exact' | 'prefix' | 'none'; prefixLength?: number; similarProducts?: Product[] } | undefined>(undefined);

  useEffect(() => {
    async function init() {
      try {
        // Set data source name for display
        setDataSource(dataService.getDataSourceName());
        
        // Initialize data source (Turso or IndexedDB)
        await dataService.initializeDataSource((count) => setLoadProgress(count));
        
        // Load other data in parallel
        await Promise.all([
          dataService.getProductCount().then(setProductCount),
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
    setMatchInfo(undefined);
    try {
      // Use smart search with prefix matching fallback
      const result = await dataService.searchByCodeSmart(code);
      
      if (result.matchType === 'exact' && result.product) {
        // Exact match found
        const product: Product = {
          code: result.product.code,
          product_name: result.product.product_name,
          brands: result.product.brands,
          normalized_brand: result.product.normalized_brand,
        };
        setMatchInfo({ type: 'exact' });
        checkCompliance(product);
      } else if (result.matchType === 'prefix' && result.product) {
        // Prefix match - found products from same manufacturer
        const product: Product = {
          code: code, // Use original scanned code
          product_name: `Unknown product (similar to ${result.product.product_name})`,
          brands: result.product.brands,
          normalized_brand: result.product.normalized_brand,
        };
        const similarProducts = result.similarProducts?.map(p => ({
          code: p.code,
          product_name: p.product_name,
          brands: p.brands,
          normalized_brand: p.normalized_brand,
        }));
        setMatchInfo({ 
          type: 'prefix', 
          prefixLength: result.prefixLength,
          similarProducts 
        });
        checkCompliance(product);
      } else {
        // No match at all
        setMatchInfo({ type: 'none' });
        setEvilStatus('unknown');
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
      const count = await db.products.count();
      setProductCount(count);
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
      const count = await db.products.count();
      setProductCount(count);
      alert(`Full dataset loaded! ${countLoaded} items processed.`);
    } catch (err) {
      alert("Full load failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportGitHubData = async () => {
    if (!confirm("Import boycott data from local TechForPalestine dataset? This will merge with your existing evil companies list and add 'Israel' to the supports array.")) return;
    
    setIsImporting(true);
    setImportProgress('Starting import...');
    
    try {
      // First, try to list available files
      setImportProgress('Checking available files...');
      const availableFiles = await listAvailableFiles();
      console.log('Available files:', availableFiles);
      
      if (availableFiles.length === 0) {
        alert('No files found in /boycott-isaraeli-consumer-goods-dataset/. Please ensure the files are in app/public/');
        setIsImporting(false);
        return;
      }

      // Step 1: Import boycott companies
      setImportProgress('Importing boycott companies from local files...');
      const mergedCompanies = await importBoycottCompanies(evilCompanies, (message) => {
        setImportProgress(message);
      });

      // Step 2: Import brands as searchable products
      setImportProgress('Importing brands as searchable products...');
      const productsImported = await importBrandsAsProducts((_count, message) => {
        if (message) setImportProgress(message);
      });

      // Step 3: Generate brand aliases
      setImportProgress('Generating brand aliases...');
      const newAliases = await generateBrandAliases();
      const mergedAliases = { ...brandAliases, ...newAliases };
      setBrandAliases(mergedAliases);

      // Update state with merged data
      setEvilCompanies(mergedCompanies);
      
      // Update product count
      const newCount = await db.products.count();
      setProductCount(newCount);
      
      // Offer to download the merged JSON
      const jsonData = exportEvilCompanies(mergedCompanies);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evil-companies-merged.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Import complete!\n- Companies: ${Object.keys(mergedCompanies).length}\n- Products added: ${productsImported}\n- Brand aliases: ${Object.keys(newAliases).length}\n\nMerged JSON file downloaded.`);
      setImportProgress('');
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed: ' + (err instanceof Error ? err.message : String(err)));
      setImportProgress('');
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-2xl font-bold mb-4 animate-pulse">Initializing Database...</div>
        <div>Processed items: {loadProgress}</div>
        <div className="text-sm mt-2 text-slate-400">
          {dataService.isTursoConfigured() ? 'Connecting to Turso Cloud...' : 'First load only.'}
        </div>
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
              by Barcode
            </button>
            <button
              onClick={() => { setActiveTab('product'); setSelectedProduct(undefined); }}
              className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'product' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              by Name
            </button>
          </div>

          <div className="p-4 sm:p-8 min-h-[400px]">
            {activeTab === 'barcode' ? (
              <BarcodeSearch onSearch={handleBarcodeSearch} isLoading={searchLoading} />
            ) : (
              <ProductSearch onSelect={checkCompliance} evilCompanies={evilCompanies} />
            )}

            <ResultDisplay
              product={selectedProduct}
              evilStatus={evilStatus}
              companyData={companyData}
              isLoading={searchLoading}
              matchInfo={matchInfo}
            />
          </div>
        </main>

        <footer className="text-center mt-10 text-slate-400 text-sm pb-10">
          <p>Powered by Open Food Facts & Community Data</p>
          <p className="text-xs mt-1 text-slate-300">Data: {dataSource}</p>
          {/* Only show data management buttons when NOT using Turso cloud */}
          {!dataService.isTursoConfigured() && (
            <>
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
              <span className="mx-2 text-slate-300">|</span>
              <button
                onClick={handleImportGitHubData}
                disabled={isImporting}
                className="mt-4 text-xs underline opacity-50 hover:opacity-100 text-red-600 disabled:opacity-30"
                title="Import boycott data from local TechForPalestine dataset files"
              >
                {isImporting ? 'Importing...' : 'Import Israel Boycott Data'}
              </button>
              {importProgress && (
                <div className="mt-2 text-xs text-slate-500 italic">{importProgress}</div>
              )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200/50 flex justify-center gap-6">
            <button
              onClick={() => { setBrowserTab('products'); setShowBrowser(true); }}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
            >
              Browse Products ({productCount.toLocaleString()})
            </button>
            <button
              onClick={() => { setBrowserTab('evil'); setShowBrowser(true); }}
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
            >
              Browse Evil List ({Object.keys(evilCompanies).length})
            </button>
          </div>
        </footer>
      </div>

      {showBrowser && (
        <DatabaseBrowser
          evilCompanies={evilCompanies}
          brandAliases={brandAliases}
          initialTab={browserTab}
          onSearch={(code) => {
            setShowBrowser(false);
            handleBarcodeSearch(code);
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}

export default App;
