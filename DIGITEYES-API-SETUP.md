# Digit-Eyes API Integration

## Overview

Digit-Eyes UPC API is used as a **fallback** when products are not found in our database. This allows users to look up products that aren't in Open Facts databases.

## Setup

1. **Get API Key:**
   - Sign up at https://www.digit-eyes.com/
   - Get your API key from your account dashboard
   - Check pricing/rate limits

2. **Add to Environment Variables:**
   ```bash
   VITE_DIGITEYES_API_KEY=your-api-key-here
   ```

3. **For Vercel Deployment:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_DIGITEYES_API_KEY` with your key

## How It Works

1. User scans/searches a barcode
2. App searches our database first (465K+ products)
3. If **not found**, automatically queries Digit-Eyes API
4. If found in Digit-Eyes, displays product info and checks boycott status
5. If not found in either, shows "Product Not Found"

## Cost Considerations

- **Our Database:** Free (Turso)
- **Digit-Eyes API:** Check their pricing (may have per-query costs or rate limits)
- **Usage:** Only called when product NOT in our database (fallback)

## API Endpoint

Based on Digit-Eyes documentation, the API endpoint format is:
```
https://www.digit-eyes.com/gtin/v2_0/?upcCode={UPC}&field_names=description,brand&language=en&app_key={API_KEY}
```

**Note:** Verify the exact endpoint format in the Digit-Eyes API documentation PDF.

## Features

- ✅ Automatic fallback (no user action needed)
- ✅ Seamless integration (looks like regular product lookup)
- ✅ Visual indicator when product comes from external API
- ✅ Still checks boycott status even for external products
- ✅ Graceful error handling (if API fails, shows "not found")

## Testing

1. Scan a barcode that's NOT in our database
2. Should automatically query Digit-Eyes
3. If found, displays product with "🌐 External Database" indicator
4. Still checks if brand is on boycott list
