# Boycott Evil — Architecture (full scope)

Ethical product scanner SPA. Production app lives in **`app/`** (not root `src/`). Live: [boycott-evil.vercel.app](https://boycott-evil.vercel.app).

## Stack

React 19, TypeScript, Vite 7, Tailwind 3. Browser-only — no custom backend. Product data: IndexedDB (dev) or Turso/libSQL (prod). Boycott lists: static JSON in `app/public/`.

## Runtime

```
app/index.html → main.tsx → App.tsx
  ├── initializeDataSource() → Dexie OR Turso
  ├── fetch evil-companies.json, good-companies.json, brand-aliases.json
  ├── Barcode tab → BarcodeSearch → CameraScanner (html5-qrcode)
  ├── Product tab → ProductSearch (debounced)
  ├── dataService.searchByCodeSmart / searchByQuery
  ├── digitEyesApi fallback (optional UPC API)
  └── checkCompliance() → ResultDisplay
```

## Compliance pipeline

1. Resolve product (local DB exact → UPC prefix → Digit-Eyes)  
2. Normalize brand via `brand-aliases.json`  
3. Match `evil-companies.json` → **evil**  
4. Match `good-companies.json` → **good**  
5. Known product, no list match → **clean**; no product → **unknown**  

## Key modules (`app/src/`)

| Path | Role |
|------|------|
| `App.tsx` | Init, tabs, search orchestration, modals |
| `dataService.ts` | IndexedDB vs Turso abstraction |
| `db.ts` | Dexie schema `BoycottEvilDB.products` |
| `tursoClient.ts` | libSQL queries, prefix barcode match |
| `dataLoader.ts` | CSV bootstrap, export helpers |
| `githubImporter.ts` | TechForPalestine dataset import |
| `digitEyesApi.ts` | External UPC fallback |
| `supportBadgeUtils.ts` | `supports[]` category badges |
| `components/*` | Barcode, camera, results, browser, modals |

## Data assets (`app/public/`)

- `evil-companies.json`, `good-companies.json`, `brand-aliases.json`  
- `off-mini.csv` — Open Food Facts subset for IndexedDB seed  
- Optional Israel consumer goods dataset folder  

## ETL (`scripts/`)

Node scripts: `import-to-turso.js`, `merge-boycott-data.js`, scraping utilities. Separate `scripts/package.json`.

## Build & deploy

```bash
cd app && npm install && npm run dev    # :5173
cd app && npm run build                 # dist/
```

Vercel: set root directory to `app`. Env: `VITE_TURSO_*`, optional `VITE_DIGITEYES_API_KEY`.

## Docs map

| Doc | Purpose |
|-----|---------|
| `TURSO-SETUP.md` | Cloud DB setup |
| `DIGITEYES-API-SETUP.md` | Barcode fallback API |
| `boycott-evil-design-document.md` | Product design |
| `docs/adr/` | Decision records |

## Legacy note

Root-level `src/` and `package.json` are an older IndexedDB-only copy. **Do not deploy from root** — use `app/`.
