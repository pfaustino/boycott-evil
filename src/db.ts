import Dexie, { type EntityTable } from 'dexie';

interface Product {
    code: string;
    product_name: string;
    brands: string;
    normalized_brand?: string;
}

const db = new Dexie('BoycottEvilDB') as Dexie & {
    products: EntityTable<Product, 'code'>;
};

db.version(1).stores({
    products: 'code, product_name, normalized_brand'
});

export type { Product };
export { db };
