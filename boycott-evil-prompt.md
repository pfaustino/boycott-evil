You are an expert full-stack web engineer working in Google Antigravity with Gemini.
I want you to design and implement a small web app in this workspace with the following requirements:
Goal
Build a browser-based app that lets a user:


Enter or scan a barcode (text input is fine for now, scanner can be a later step).


Or search by product name.


Look up that product in a local subset of the Kaggle Open Food Facts dataset.


Extract the brand/company name.


Check whether the brand is in a local "evil companies" list.


Display whether the company is flagged as evil, and show alternative companies if available.


Data assumptions


I will provide a pre-filtered CSV file derived from the Kaggle “Open Food Facts” / “World Food Facts” dataset. It will contain at least these columns:


code (barcode, string)


product_name


brands (string, possibly multiple comma-separated brands)




You should assume the file will be stored under something like public/off-mini.csv.


There is also a JSON file, public/evil-companies.json, with this shape:
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



We may later add an alias mapping file like brand-aliases.json to map sub-brands to parent companies (e.g., KitKat -> Nestle).


Architecture preferences


Use a modern frontend stack (React + TypeScript + Vite is preferred, but I’m OK with your recommendation).


For local storage/search:


Use IndexedDB (via a small wrapper like Dexie.js or idb) to persist product records keyed by code.


Maintain a small in-memory index if helpful for product-name search.




Keep implementation entirely client-side for now (no backend server).


Functional requirements


On first load:


Download off-mini.csv from public/.


Parse it and store minimally needed fields into IndexedDB: code, product_name, normalized brand string.


Show a progress indicator while loading.




Barcode lookup view:


Provide a text input labeled “Barcode”.


On submit, look up the record by exact code.


If found:


Show product name and brand.


Normalize brand (lowercase, trimmed, first comma-separated value).


Look up in evil-companies.json, matching normalized brand (and aliases if alias file is present).


Display:


Evil status (yes/no/unknown).


Reason and alternatives if evil.






If not found, show a user-friendly “not found” message.




Product name search view:


Provide a text input labeled “Product name”.


On typing, perform a simple search (contains or starts-with) over product names.


Show a small list of matching products; clicking one runs the same brand → evil-check flow.




Evil status UI:


Show a clear visual indicator (e.g., red badge for evil, gray/green for not evil).


If alternatives exist, show them in a small list with the brand names.




Non-functional requirements


Keep bundle size reasonable; don’t include huge libraries unless necessary.


Keep code clean and well-structured:


Separate data-access layer (IndexedDB logic) from UI components.


Include types/interfaces for product records and evil-company records.




Add basic error handling and logging if CSV/JSON fails to load.


What I want from you


First, generate a clear implementation plan and file structure for the project. Get my approval before writing code.


Then, scaffold the project and implement:


CSV loading and IndexedDB setup.


Evil company JSON loading.


Barcode lookup view.


Product search view.


Result display components.




After implementation, provide:


Instructions on how to run the app locally.


A brief explanation of where to drop my off-mini.csv and evil-companies.json files.




Please confirm assumptions that you need from me (e.g., exact CSV path, whether I already have off-mini.csv prepared) and then proceed in Planning mode with an implementation plan before touching code.