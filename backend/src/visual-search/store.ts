import type { Product, ProductWithoutEmbedding } from "./types";

// In-memory store - products won't persist across serverless invocations
// For production, use a database instead
let products: Product[] = [];

// Check if we're in a serverless environment
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Only attempt file operations in non-serverless environments
let fsModule: typeof import("node:fs") | null = null;
let pathModule: typeof import("node:path") | null = null;
let DATA_DIR = "";
let PRODUCTS_FILE = "";

async function initFileSystem(): Promise<boolean> {
  if (isServerless) {
    console.log("[Store] Running in serverless mode - using in-memory store only");
    return false;
  }

  try {
    fsModule = await import("node:fs");
    pathModule = await import("node:path");
    
    // Use process.cwd() instead of import.meta.url for better compatibility
    DATA_DIR = pathModule.join(process.cwd(), "data");
    PRODUCTS_FILE = pathModule.join(DATA_DIR, "products.json");
    return true;
  } catch (error) {
    console.log("[Store] File system not available, using in-memory store");
    return false;
  }
}

function ensureDataDir(): void {
  if (!fsModule || !DATA_DIR) return;
  
  if (!fsModule.existsSync(DATA_DIR)) {
    fsModule.mkdirSync(DATA_DIR, { recursive: true });
    console.log("[Store] Created data directory:", DATA_DIR);
  }
}

async function loadProducts(): Promise<void> {
  const fsAvailable = await initFileSystem();
  if (!fsAvailable || !fsModule || !PRODUCTS_FILE) {
    console.log("[Store] Starting with empty in-memory store");
    return;
  }

  ensureDataDir();

  if (fsModule.existsSync(PRODUCTS_FILE)) {
    try {
      const data = fsModule.readFileSync(PRODUCTS_FILE, "utf-8");
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
  if (!fsModule || !PRODUCTS_FILE || isServerless) return;

  ensureDataDir();

  try {
    const data = JSON.stringify(products, null, 2);
    fsModule.writeFileSync(PRODUCTS_FILE, data, "utf-8");
    console.log(`[Store] Saved ${products.length} products to file`);
  } catch (error) {
    console.error("[Store] Error saving products:", error);
  }
}

// Initialize store (don't block module loading)
let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    initialized = true;
    await loadProducts();
  }
}

// Call initialization but don't await at module level
ensureInitialized().catch(console.error);

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
