/**
 * Visual Search Routes
 * Elysia router for visual search API endpoints
 */

import { Elysia } from "elysia";
import { checkEmbeddingsHealth, embedImage, embedText } from "./embeddings";
import { cosineSimilarity } from "./similarity";
import {
  addProduct,
  getProductCount,
  getProducts,
  getProductsWithEmbeddings,
} from "./store";
import type {
  AddProductResponse,
  Product,
  ProductWithoutEmbedding,
  SearchResponse,
  SearchResult,
} from "./types";

/**
 * Remove embedding from product for API response
 */
function toProductWithoutEmbedding(product: Product): ProductWithoutEmbedding {
  const { embedding, ...rest } = product;
  return rest;
}

/**
 * Visual Search Elysia Plugin
 */
export const visualSearchRoutes = new Elysia({ prefix: "/vs" })
  // Health check
  .get("/health", async () => {
    const embeddingsOk = await checkEmbeddingsHealth();

    return {
      status: "ok",
      services: {
        embeddings: embeddingsOk ? "connected" : "unavailable",
      },
      productCount: getProductCount(),
    };
  })

  // List all products
  .get("/products", () => {
    const products = getProducts();
    console.log(`[VS] Listing ${products.length} products`);
    return { products };
  })

  // Add a new product (Vendor flow)
  .post("/products", async ({ body, set }) => {
    const reqBody = body as { name?: string; imageBase64?: string };
    const { name, imageBase64 } = reqBody;

    // Manual validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      set.status = 400;
      return { error: "Invalid request", message: "Product name is required" };
    }

    if (
      !imageBase64 ||
      typeof imageBase64 !== "string" ||
      imageBase64.length === 0
    ) {
      set.status = 400;
      return { error: "Invalid request", message: "Image is required" };
    }

    console.log(`[VS] Adding product: ${name}`);

    try {
      // Generate image embedding directly using jina-clip
      console.log("[VS] Generating image embedding...");
      const embedding = await embedImage(imageBase64);

      // Create and store the product
      const product: Product = {
        id: crypto.randomUUID(),
        name: name.trim(),
        imageBase64,
        embedding,
        createdAt: new Date(),
      };

      addProduct(product);
      console.log(`[VS] Product added: ${product.id}`);

      const response: AddProductResponse = {
        product: toProductWithoutEmbedding(product),
      };

      set.status = 201;
      return response;
    } catch (error) {
      console.error("[VS] Error adding product:", error);
      set.status = 500;
      return {
        error: "Failed to add product",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Visual search by image (Consumer flow - Image → Image)
  .post("/search", async ({ body, set }) => {
    const reqBody = body as { imageBase64?: string; topK?: number };
    const { imageBase64, topK = 10 } = reqBody;

    // Manual validation
    if (
      !imageBase64 ||
      typeof imageBase64 !== "string" ||
      imageBase64.length === 0
    ) {
      set.status = 400;
      return { error: "Invalid request", message: "Image is required" };
    }

    const effectiveTopK = Math.min(Math.max(topK || 10, 1), 50);

    console.log("[VS] Processing image search query...");

    const products = getProductsWithEmbeddings();

    if (products.length === 0) {
      console.log("[VS] No products to search");
      return {
        results: [],
        message: "No products in the database yet",
      };
    }

    try {
      // Generate image embedding for the query image
      console.log("[VS] Generating query image embedding...");
      const queryEmbedding = await embedImage(imageBase64);

      // Compute similarity scores for all products (image-to-image)
      console.log("[VS] Computing similarities...");
      const scored = products.map((product) => ({
        product,
        score: cosineSimilarity(queryEmbedding, product.embedding),
      }));

      // Sort by similarity (descending) and take top K
      scored.sort((a, b) => b.score - a.score);
      const topResults = scored.slice(0, effectiveTopK);

      // Format response
      const results: SearchResult[] = topResults.map(({ product, score }) => ({
        product: toProductWithoutEmbedding(product),
        score: Math.round(score * 10_000) / 10_000, // Round to 4 decimal places
      }));

      console.log(
        `[VS] Found ${results.length} results, top score: ${results[0]?.score}`
      );

      const response: SearchResponse = {
        results,
      };

      return response;
    } catch (error) {
      console.error("[VS] Error during image search:", error);
      set.status = 500;
      return {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Text search by query string (Consumer flow - Text → Image)
  .post("/search/text", async ({ body, set }) => {
    const reqBody = body as { query?: string; topK?: number };
    const { query, topK = 10 } = reqBody;

    // Manual validation
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      set.status = 400;
      return { error: "Invalid request", message: "Search query is required" };
    }

    const effectiveTopK = Math.min(Math.max(topK || 10, 1), 50);

    console.log(`[VS] Processing text search: "${query}"`);

    const products = getProductsWithEmbeddings();

    if (products.length === 0) {
      console.log("[VS] No products to search");
      return {
        results: [],
        message: "No products in the database yet",
      };
    }

    try {
      // Generate text embedding for the query (cross-modal: text → image)
      console.log("[VS] Generating query text embedding...");
      const queryEmbedding = await embedText(query.trim());

      // Compute similarity scores against image embeddings
      console.log("[VS] Computing cross-modal similarities...");
      const scored = products.map((product) => ({
        product,
        score: cosineSimilarity(queryEmbedding, product.embedding),
      }));

      // Sort by similarity (descending) and take top K
      scored.sort((a, b) => b.score - a.score);
      const topResults = scored.slice(0, effectiveTopK);

      // Format response
      const results: SearchResult[] = topResults.map(({ product, score }) => ({
        product: toProductWithoutEmbedding(product),
        score: Math.round(score * 10_000) / 10_000, // Round to 4 decimal places
      }));

      console.log(
        `[VS] Found ${results.length} results, top score: ${results[0]?.score}`
      );

      return {
        results,
      };
    } catch (error) {
      console.error("[VS] Error during text search:", error);
      set.status = 500;
      return {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
