# Boycott Evil

A client-side web application to scan barcodes or search products and check if their brands are on a boycott list.

## Setup & Running

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## Data Files

The application expects two files in the `public/` directory:

*   `off-mini.csv`: Product database (Open Food Facts subset).
*   `evil-companies.json`: List of companies to boycott.

Dummy files have been created for development. Replace them with real datasets as needed.

## Building

To build for production:
```bash
npm run build
```
