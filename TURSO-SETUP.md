# Turso Database Setup Guide

This guide walks you through setting up Turso as the backend database for the Boycott Evil app.

## Why Turso?

- **9 GB free storage** — fits the entire Open Food Facts dataset
- **1 billion row reads/month** — essentially unlimited for this app
- **SQLite-compatible** — simple queries, familiar syntax
- **Edge replicas** — fast reads globally

## Step 1: Create a Turso Account

1. Go to [https://turso.tech](https://turso.tech)
2. Sign up with GitHub (recommended) or email
3. You'll land on the dashboard

## Step 2: Create a Database

1. Click **"Create Database"**
2. Name it: `boycott-evil-products` (or any name you prefer)
3. Select the closest region to your users
4. Click **Create**

## Step 3: Get Your Credentials

1. Click on your new database
2. Go to the **"Connect"** tab
3. Copy the **Database URL** (looks like: `libsql://boycott-evil-products-username.turso.io`)
4. Click **"Generate Token"** → **"Read & Write"**
5. Copy the **Auth Token**

## Step 4: Configure Environment Variables

### For the Import Script

In PowerShell:
```powershell
$env:TURSO_DATABASE_URL = "libsql://your-database-url.turso.io"
$env:TURSO_AUTH_TOKEN = "your-auth-token"
```

In Bash:
```bash
export TURSO_DATABASE_URL="libsql://your-database-url.turso.io"
export TURSO_AUTH_TOKEN="your-auth-token"
```

### For the App

Create `app/.env` file:
```env
VITE_TURSO_DATABASE_URL=libsql://your-database-url.turso.io
VITE_TURSO_AUTH_TOKEN=your-auth-token
```

## Step 5: Install Dependencies and Import Data

```bash
# Install dependencies for the import script
cd scripts
npm install

# Run the import (with environment variables set)
node import-to-turso.js
```

The import will:
1. Create the `products` table
2. Create indexes for fast lookups
3. Import all products from `off-mini.csv`

This takes about 2-5 minutes depending on your connection.

## Step 6: Verify the Import

After the import completes, go to your Turso dashboard:
1. Click on your database
2. Go to the **"Shell"** tab
3. Run: `SELECT COUNT(*) FROM products;`
4. You should see ~10,000+ products (from off-mini.csv)

## Step 7: Run the App

```bash
cd app
npm run dev
```

The app will now query Turso instead of using local IndexedDB!

## Importing the Full Dataset

To import the full Open Food Facts dataset (~1GB, 3M+ products):

1. Download `off-full.tsv` from Open Food Facts
2. Update the import script to use TSV parsing
3. Run the import (will take 30-60 minutes)

## Troubleshooting

### "Turso client not initialized" error
- Make sure `.env` file exists in `app/` directory
- Check that variable names start with `VITE_`
- Restart the dev server after adding `.env`

### Import fails with timeout
- Turso free tier has rate limits
- Try reducing BATCH_SIZE in the import script
- Wait a few minutes and retry

### Slow queries
- Ensure indexes were created
- Check the Shell tab for index status:
  ```sql
  .schema products
  ```

## Security Notes

- **Never commit `.env` files** — they contain secrets
- Use environment variables in production (Vercel, Netlify, etc.)
- Rotate auth tokens periodically
