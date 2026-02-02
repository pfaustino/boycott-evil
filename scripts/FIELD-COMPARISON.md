# Field-by-Field Comparison: Import Data vs Database Schema

## Current Database Schema (Turso)

```sql
CREATE TABLE products (
    code TEXT PRIMARY KEY,           -- Barcode/product ID
    product_name TEXT,                -- Product name
    brands TEXT,                      -- Brand names (comma-separated)
    normalized_brand TEXT,            -- First brand, lowercased (for lookups)
    generic_name TEXT                 -- Generic product name/description
)
```

**Indexes:**
- `idx_normalized_brand` on `normalized_brand`
- `idx_product_name` on `product_name`

---

## Source File Fields (Open Facts TSV)

The source files have **200+ columns**, but we only extract:

| Source Column | Used? | Purpose |
|---------------|-------|---------|
| `code` | ✅ **YES** | Primary key (barcode) |
| `product_name` | ✅ **YES** | Product name |
| `product_name_en` | ⚠️ **FALLBACK** | Used if `product_name` missing |
| `brands` | ✅ **YES** | Brand names (comma-separated) |
| `brands_tags` | ⚠️ **FALLBACK** | Used if `brands` missing |
| `generic_name` | ✅ **YES** | Generic product name/description |
| All other 194+ columns | ❌ **NO** | Ignored |

---

## Import Script Extraction

### Step 1: Extract from Source File
```javascript
const code = values[codeIdx]?.trim();                    // From 'code' column
const productName = values[nameIdx]?.trim() || '';       // From 'product_name' or 'product_name_en'
const brands = values[brandsIdx]?.trim() || '';         // From 'brands' or 'brands_tags'
const genericName = values[genericNameIdx]?.trim() || ''; // From 'generic_name'
```

### Step 2: Normalize Brand
```javascript
const normalizedBrand = brands.split(',')[0].trim().toLowerCase();
// Takes first brand, lowercases it for lookups
```

### Step 3: Create Product Object
```javascript
{
    code: code,                          // TEXT - barcode
    product_name: productName,           // TEXT - product name
    brands: brands,                      // TEXT - all brands
    normalized_brand: normalizedBrand,   // TEXT - first brand, lowercased
    generic_name: genericName            // TEXT - generic product name
}
```

---

## Field-by-Field Comparison

| Database Field | Source Field | Data Type | Required | Transformation | Status |
|----------------|--------------|-----------|----------|----------------|--------|
| `code` | `code` | TEXT | ✅ Yes | Trim whitespace | ✅ **MATCH** |
| `product_name` | `product_name` or `product_name_en` | TEXT | ⚠️ Optional | Trim, fallback to empty string | ✅ **MATCH** |
| `brands` | `brands` or `brands_tags` | TEXT | ⚠️ Optional | Trim, fallback to empty string | ✅ **MATCH** |
| `normalized_brand` | Derived from `brands` | TEXT | ⚠️ Optional | First brand, lowercase | ✅ **MATCH** |
| `generic_name` | `generic_name` | TEXT | ⚠️ Optional | Trim, fallback to empty string | ✅ **MATCH** |

---

## Safety Checks

### ✅ No New Fields
- **Import script only uses 5 fields** that already exist in the database
- **No new columns** will be added (generic_name added via migration)
- **Schema migration** required: run `add-generic-name-column.js` first

### ✅ Data Type Compatibility
- All fields are `TEXT` in database
- All extracted values are strings (or empty strings)
- **No type mismatches**

### ✅ Required Fields
- `code` is required (rows without code are skipped)
- Other fields are optional (empty strings allowed)

### ✅ Data Validation
- Code is trimmed (no leading/trailing spaces)
- Product name and brands are trimmed
- Normalized brand is derived consistently

---

## Comparison with Original Import Script

| Aspect | Original (`import-tsv-to-turso.js`) | New (`import-additional-databases.js`) | Status |
|--------|-------------------------------------|---------------------------------------|--------|
| **Fields extracted** | `code`, `product_name`, `brands`, `generic_name` | `code`, `product_name`/`product_name_en`, `brands`/`brands_tags`, `generic_name` | ✅ Same 5 fields |
| **Database fields** | `code`, `product_name`, `brands`, `normalized_brand`, `generic_name` | `code`, `product_name`, `brands`, `normalized_brand`, `generic_name` | ✅ **IDENTICAL** |
| **Insert statement** | `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand, generic_name)` | `INSERT OR REPLACE INTO products (code, product_name, brands, normalized_brand, generic_name)` | ✅ **IDENTICAL** |
| **Normalization** | First brand, lowercase | First brand, lowercase | ✅ **IDENTICAL** |
| **Data truncation** | 500 chars for name/brands/generic_name | None (but TEXT has limits) | ⚠️ Minor difference |

---

## Potential Issues & Mitigations

### ⚠️ Issue 1: Very Long Product Names
- **Risk**: Product names could be very long
- **Mitigation**: SQLite TEXT can handle up to ~1GB, but we could add truncation
- **Current**: No truncation (same as original script for food data)

### ⚠️ Issue 2: Missing Fields
- **Risk**: Some products might not have names or brands
- **Mitigation**: Script handles empty strings gracefully
- **Current**: Empty strings are allowed (same as original)

### ⚠️ Issue 3: Duplicate Barcodes
- **Risk**: Same barcode in multiple databases
- **Mitigation**: `INSERT OR REPLACE` will update with latest data
- **Current**: Last import wins (intentional merge behavior)

---

## Conclusion

✅ **SAFE TO IMPORT** (after migration)

- **Schema migration required**: Run `add-generic-name-column.js` first
- **5 fields** total: code, product_name, brands, normalized_brand, generic_name
- **Compatible data types** (all TEXT)
- **Same insert pattern** as original import script
- **generic_name** field matches source field name for future delta updates

**Migration Steps:**
1. Run `node scripts/add-generic-name-column.js` to add the column
2. Then run import scripts as normal

The import script is **100% compatible** with the updated database schema.
