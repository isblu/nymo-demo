/**
 * Product Store with JSON File Persistence
 * Products are stored in a JSON file for persistence across server restarts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Product, ProductWithoutEmbedding } from "./types";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the JSON storage file
const DATA_DIR = join(__dirname, "..", "..", "data");
const PRODUCTS_FILE = join(DATA_DIR, "products.json");

// In-memory storage (backed by JSON file)
let products: Product[] = [];

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log("[Store] Created data directory:", DATA_DIR);
  }
}

/**
 * Load products from JSON file
 */
function loadProducts(): void {
  ensureDataDir();

  if (existsSync(PRODUCTS_FILE)) {
    try {
      const data = readFileSync(PRODUCTS_FILE, "utf-8");
      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
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

/**
 * Save products to JSON file
 */
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

// Load products on module initialization
loadProducts();

/**
 * Add a new product to the store
 */
export function addProduct(product: Product): Product {
  products.push(product);
  saveProducts();
  return product;
}

/**
 * Get all products (without embeddings for smaller payload)
 */
export function getProducts(): ProductWithoutEmbedding[] {
  return products.map(({ embedding, ...rest }) => rest);
}

/**
 * Get a product by ID
 */
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/**
 * Get all products with embeddings (for search)
 */
export function getProductsWithEmbeddings(): Product[] {
  return products;
}

/**
 * Clear all products (useful for testing)
 */
export function clearProducts(): void {
  products.length = 0;
  saveProducts();
}

/**
 * Get product count
 */
export function getProductCount(): number {
  return products.length;
}
