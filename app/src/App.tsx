import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import { db, type Product } from './db';
import { loadProductData, loadLargeProductData, loadEvilCompanies, loadGoodCompanies, loadBrandAliases, clearData, exportEvilCompanies, type EvilCompanies, type GoodCompanies } from './dataLoader';
import { importBoycottCompanies, importBrandsAsProducts, generateBrandAliases, listAvailableFiles } from './githubImporter';
import * as dataService from './dataService';
import BarcodeSearch from './components/BarcodeSearch';
import ProductSearch from './components/ProductSearch';
import ResultDisplay from './components/ResultDisplay';
import DatabaseBrowser from './components/DatabaseBrowser';
import ShareModal from './components/ShareModal';

function App() {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [evilCompanies, setEvilCompanies] = useState<EvilCompanies>({});
  const [goodCompanies, setGoodCompanies] = useState<GoodCompanies>({});
  const [brandAliases, setBrandAliases] = useState<Record<string, string>>({});
  const [productCount, setProductCount] = useState(0);

  const [activeTab, setActiveTab] = useState<'barcode' | 'product'>('barcode');
  const [showBrowser, setShowBrowser] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [browserTab, setBrowserTab] = useState<'products' | 'evil' | 'evil-products'>('products');

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [evilStatus, setEvilStatus] = useState<'evil' | 'clean' | 'good' | 'unknown'>('unknown');
  const [companyData, setCompanyData] = useState<EvilCompanies[string] | undefined>(undefined);
  const [goodCompanyData, setGoodCompanyData] = useState<GoodCompanies[string] | undefined>(undefined);
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
          loadGoodCompanies().then(setGoodCompanies),
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

  // Helper: Try to find a brand from product name using aliases
  const extractBrandFromName = (productName: string): string | null => {
    const nameLower = productName.toLowerCase();
    // Check all aliases - if product name contains a known alias, return the parent company
    for (const [alias, parent] of Object.entries(brandAliases)) {
      if (nameLower.includes(alias.toLowerCase())) {
        return parent.toLowerCase();
      }
    }
    // Also check direct evil company names
    for (const company of Object.keys(evilCompanies)) {
      if (nameLower.includes(company.toLowerCase())) {
        return company.toLowerCase();
      }
    }
    return null;
  };

  const checkCompliance = (product: Product) => {
    setSearchLoading(true);
    setCompanyData(undefined);
    setGoodCompanyData(undefined);

    // Normalize logic - use brand field, or try to extract from product name
    let brand = product.normalized_brand;
    let extractedFromName = false;
    let displayBrand = product.brands;
    
    // If brand is empty, try to extract from product name
    if (!brand && product.product_name) {
      const extracted = extractBrandFromName(product.product_name);
      if (extracted) {
        brand = extracted;
        extractedFromName = true;
        // Also find the parent company name for display
        const parentCompany = brandAliases[extracted] || extracted;
        displayBrand = parentCompany.charAt(0).toUpperCase() + parentCompany.slice(1);
      }
    }
    
    // Update product with extracted brand for display
    const displayProduct = {
      ...product,
      brands: displayBrand || product.brands,
      normalized_brand: brand || product.normalized_brand
    };
    setSelectedProduct(displayProduct);

    // Wait a tick for UI
    setTimeout(() => {
      if (!brand) {
        setEvilStatus('unknown');
        setSearchLoading(false);
        return;
      }

      // Check evil companies first
      const evilInfo = evilCompanies[brand];
      if (evilInfo && evilInfo.evil) {
        track('product_result', { status: 'boycott', brand: brand, supports: evilInfo.supports?.join(',') || '', extracted: extractedFromName });
        setEvilStatus('evil');
        setCompanyData(evilInfo);
        setSearchLoading(false);
        return;
      }

      // Check aliases for evil
      const parentCompany = brandAliases[brand];
      if (parentCompany && evilCompanies[parentCompany.toLowerCase()]?.evil) {
        const parentInfo = evilCompanies[parentCompany.toLowerCase()];
        track('product_result', { status: 'boycott', brand: parentCompany, supports: parentInfo.supports?.join(',') || '', extracted: extractedFromName });
        setEvilStatus('evil');
        setCompanyData(parentInfo);
        setSearchLoading(false);
        return;
      }

      // Check good companies
      const goodInfo = goodCompanies[brand];
      if (goodInfo && goodInfo.good) {
        track('product_result', { status: 'recommended', brand: brand, supports: goodInfo.supports?.join(',') || '' });
        setEvilStatus('good');
        setGoodCompanyData(goodInfo);
        setSearchLoading(false);
        return;
      }

      // Check aliases for good
      if (parentCompany && goodCompanies[parentCompany.toLowerCase()]?.good) {
        const parentGoodInfo = goodCompanies[parentCompany.toLowerCase()];
        track('product_result', { status: 'recommended', brand: parentCompany, supports: parentGoodInfo.supports?.join(',') || '' });
        setEvilStatus('good');
        setGoodCompanyData(parentGoodInfo);
        setSearchLoading(false);
        return;
      }

      // Neither evil nor good
      track('product_result', { status: 'unknown', brand: brand });
      setEvilStatus('clean');
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
        track('barcode_search', { result: 'exact', brand: result.product.brands });
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
        track('barcode_search', { result: 'prefix', brand: result.product.brands });
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
        track('barcode_search', { result: 'not_found' });
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
          <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setActiveTab('barcode'); setSelectedProduct(undefined); }}
              className={`flex-1 py-3 px-4 font-semibold text-center rounded-lg transition-all duration-200 ${
                activeTab === 'barcode' 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              📷 by Barcode
            </button>
            <button
              onClick={() => { setActiveTab('product'); setSelectedProduct(undefined); }}
              className={`flex-1 py-3 px-4 font-semibold text-center rounded-lg transition-all duration-200 ${
                activeTab === 'product' 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              🔍 by Name
            </button>
          </div>

          <div className="p-4 sm:p-8 min-h-[400px]">
            {activeTab === 'barcode' ? (
              <BarcodeSearch onSearch={handleBarcodeSearch} isLoading={searchLoading} />
            ) : (
              <ProductSearch onSelect={checkCompliance} evilCompanies={evilCompanies} goodCompanies={goodCompanies} />
            )}

            <ResultDisplay
              product={selectedProduct}
              evilStatus={evilStatus}
              companyData={companyData}
              goodCompanyData={goodCompanyData}
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

          <div className="mt-6 pt-6 border-t border-slate-200/50 flex flex-col items-center gap-3">
            <div className="flex gap-4">
              <button
                onClick={() => { setBrowserTab('evil'); setShowBrowser(true); track('browse_list_clicked'); }}
                className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
              >
                📋 Browse Boycott List ({Object.keys(evilCompanies).length} companies)
              </button>
              <button
                onClick={() => { setShowShareModal(true); track('share_button_clicked'); }}
                className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
              >
                📤 Share App
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {productCount.toLocaleString()} products in database
            </p>
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

      {showShareModal && (
        <ShareModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

export default App;
