import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Product, ProductWithoutEmbedding } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "..", "..", "data");
const PRODUCTS_FILE = join(DATA_DIR, "products.json");

let products: Product[] = [];

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log("[Store] Created data directory:", DATA_DIR);
  }
}

function loadProducts(): void {
  ensureDataDir();

  if (existsSync(PRODUCTS_FILE)) {
    try {
      const data = readFileSync(PRODUCTS_FILE, "utf-8");
      const parsed = JSON.parse(data);

      products = parsed.map((p: Product & { createdAt: string }) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));

      console.log(`[Store] Loaded ${products.length} products from file`);
    } catch (error) {
      console.error("[Store] Error loading products:", error);
      products = [];
    }
  } else {
    console.log("[Store] No existing products file, starting fresh");
    products = [];
  }
}

function saveProducts(): void {
  ensureDataDir();

  try {
    const data = JSON.stringify(products, null, 2);
    writeFileSync(PRODUCTS_FILE, data, "utf-8");
    console.log(`[Store] Saved ${products.length} products to file`);
  } catch (error) {
    console.error("[Store] Error saving products:", error);
  }
}

loadProducts();

export function addProduct(product: Product): Product {
  products.push(product);
  saveProducts();
  return product;
}

export function getProducts(): ProductWithoutEmbedding[] {
  return products.map(({ embedding, ...rest }) => rest);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsWithEmbeddings(): Product[] {
  return products;
}

export function clearProducts(): void {
  products.length = 0;
  saveProducts();
}

export function getProductCount(): number {
  return products.length;
}
