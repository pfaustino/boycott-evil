High-level design
Goal
Build a browser-based app where a user can either scan a barcode (or type it) or type a product name, then see the brand/company and whether it’s in a predefined “evil companies” list.

Core flow

User scans barcode or types barcode / product name.

App looks up the product in a local subset of the Kaggle Open Food Facts dataset (CSV with barcodes and brands).

App extracts brand/company (using brands or brands_tags fields).

App checks brand/company against a locally stored "evil companies" list.

App displays:

Brand/company name.

Whether it’s considered “evil”.

Optional suggested alternatives if in the list.

Data model
We’ll work from the Kaggle Open Food Facts CSV, which includes fields like code (barcode), product_name, brands, brands_tags, countries, etc.
​

Minimal fields to keep in the app:

code: string, the barcode (UPC/EAN).

product_name: string.

brands: string (e.g., "Nestle" or "Nestle, SomeSubBrand").

(Optional) countries or countries_en to filter to relevant markets.

"Evil" companies config (custom JSON you define in the project):

json
{
  "Nestle": {
    "evil": true,
    "reason": "Example reason",
    "alternatives": ["LocalCo", "AnotherBrand"]
  },
  "Coca-Cola": {
    "evil": true,
    "reason": "Example reason",
    "alternatives": ["Independent Soda Co"]
  }
}
Lookups should:

Normalize brand names (trim, lowercase, strip punctuation).

Allow mapping sub-brands to parent (e.g., “KitKat” → “Nestle”) via a small alias map you maintain.

Architecture
Frontend-only MVP (preferred for now)

Framework: React or plain Vite + TS.

Storage: Load a pre-filtered CSV subset into the browser (e.g., 50–200k rows), then store in IndexedDB for fast offline queries.

Barcode scanning:

Option A: JS barcode scanner library using camera (html5-qrcode, Quagga2, or similar).

Option B: For now, just text input for the exercise; scanner can be a future task.
​

Data loading strategy

Because the full Kaggle/Open Food Facts exports can be big, we’ll:

Pre-process the CSV offline (Python/Node) to keep only:

code, product_name, brands.

Optionally filter to countries that you care about (e.g., US).

Serve this "mini CSV" or JSON (e.g., off-mini.csv) from the app’s public assets.

On first load, parse the file and store it in IndexedDB keyed by code, with a secondary index on normalized product_name.

Key components / features
Data loader

On first run, download and parse off-mini.csv.

Store in IndexedDB: { code, productName, brandNormalized }.

Show a progress indicator (e.g., “Loading 12k products…”).

Search / input UI

A tab or toggle for:

"Scan / enter barcode"

"Search by product name"

Inputs:

Barcode input: numeric text field, later replaced/augmented by scanner.

Product search: text field with autocomplete or list of matches.

Lookup logic

For barcode:

Query IndexedDB by exact code.

For product name:

Search by pattern/contains match on normalized product_name (can load into memory for the subset, or use a simple indexed search).

Extract primary brand from brands (take the first comma-separated value, normalize).

Evil company check

Load evil-companies.json at startup.

Normalize brand name and any alias mapping.

If brand found in config:

Mark as evil: true, show reason and alternatives.

Otherwise:

Mark as evil: false or “Unknown”.

Results display

Show:

Product name.

Brand / company name.

Evil status (e.g., red warning if evil, green neutral if not).

Alternative recommendations if applicable.

Extensibility

Later tasks:

Add camera barcode scanning.

Add logo scanning as a separate mode.

Sync updated Kaggle/Open Food Facts data via service worker.

Constraints / tradeoffs
Size: Kaggle subset should be kept under ~50–100MB uncompressed for reasonable load times.

Accuracy: Brand matching via brands isn't perfect; alias mapping is necessary to map sub-brands to parent companies.

Performance: Using IndexedDB avoids loading everything into RAM, but a smaller in-memory index (code → brand) is acceptable for a limited subset.