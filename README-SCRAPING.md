# Scraping Ethical Consumer Boycotts

This directory contains scripts to scrape boycott data from [Ethical Consumer's boycotts page](https://www.ethicalconsumer.org/ethicalcampaigns/boycotts).

## Available Scripts

### Node.js Version
**File:** `scrape-ethical-consumer-boycotts.js`

**Setup:**
```bash
npm install cheerio axios
```

**Run:**
```bash
node scrape-ethical-consumer-boycotts.js
```

### Python Version
**File:** `scrape-ethical-consumer-boycotts-python.py`

**Setup:**
```bash
pip install requests beautifulsoup4
```

**Run:**
```bash
python scrape-ethical-consumer-boycotts-python.py
```

## Output Files

Both scripts generate two files:

1. **`ethical-consumer-boycotts.json`** - Full scraped data with all details
2. **`ethical-consumer-evil-companies.json`** - Formatted for our app's evil-companies structure

## Data Structure

The output follows our app's format:
```json
{
  "company-name": {
    "evil": true,
    "reason": "Description of why to boycott",
    "alternatives": [],
    "supports": ["Labor", "Environment", "Animal-Testing", "Israel"]
  }
}
```

## Categories Mapped to Supports

- **Human Rights / BDS** → `["Israel"]`
- **Workers' Rights / Labor** → `["Labor"]`
- **Environment / Climate** → `["Environment"]`
- **Animal Testing** → `["Animal-Testing"]`
- **Tax Avoidance** → `["Tax Avoidance"]` (if you add this category)

## Notes

- The scripts attempt to parse the HTML structure, but the website structure may change
- You may need to adjust selectors if the page structure is different
- Some companies may appear multiple times (e.g., Amazon has multiple boycott reasons)
- The scripts handle basic deduplication

## Manual Alternative

If scraping doesn't work, you can:
1. Visit the page manually
2. Copy the company data
3. Use the import function in the app to merge it with existing data
