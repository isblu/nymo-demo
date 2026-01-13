import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { products, type NewProduct, type Product } from "../db/schema";
import type { ProductWithoutEmbedding, SearchResult } from "./types";

/**
 * Add a new product to the database
 */
export async function addProduct(product: NewProduct): Promise<Product> {
  const db = getDb();

  const [inserted] = await db.insert(products).values(product).returning();

  if (!inserted) {
    throw new Error("Failed to insert product");
  }

  console.log(`[Store] Product added: ${inserted.id}`);
  return inserted;
}

/**
 * Get all products without embeddings (for listing)
 */
export async function getProducts(): Promise<ProductWithoutEmbedding[]> {
  const db = getDb();

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,
    })
    .from(products)
    .orderBy(products.createdAt);

  return results;
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  const db = getDb();

  const [product] = await db.select().from(products).where(eq(products.id, id));

  return product;
}

/**
 * Get total product count
 */
export async function getProductCount(): Promise<number> {
  const db = getDb();

  const result = await db.select({ count: sql<number>`count(*)` }).from(products);

  return Number(result[0]?.count ?? 0);
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDb();

  const result = await db.delete(products).where(eq(products.id, id)).returning();

  return result.length > 0;
}

/**
 * Delete all products
 */
export async function clearProducts(): Promise<void> {
  const db = getDb();

  await db.delete(products);
  console.log("[Store] All products cleared");
}

/**
 * Find similar products using vector cosine similarity
 * Uses pgvector's <=> operator for cosine distance
 */
export async function findSimilarProducts(
  queryEmbedding: number[],
  topK: number
): Promise<SearchResult[]> {
  const db = getDb();

  // Format the embedding as a vector string for pgvector
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Use raw SQL for vector similarity search
  // The <=> operator computes cosine distance (1 - cosine_similarity)
  // So we compute 1 - distance to get similarity score
  const results = await db.execute(sql`
    SELECT 
      id,
      name,
      image_url,
      created_at,
      1 - (embedding <=> ${vectorStr}::vector) as score
    FROM products
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `);

  // postgres.js returns rows directly as an array
  return (results as unknown as Array<{
    id: string;
    name: string;
    image_url: string;
    created_at: Date;
    score: number;
  }>).map((row) => ({
    product: {
      id: row.id,
      name: row.name,
      imageUrl: row.image_url,
      createdAt: new Date(row.created_at),
    },
    score: Math.round(row.score * 10_000) / 10_000,
  }));
}
