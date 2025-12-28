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

function toProductWithoutEmbedding(product: Product): ProductWithoutEmbedding {
  const { ...rest } = product;
  return rest;
}

export const visualSearchRoutes = new Elysia({ prefix: "/vs" })
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

  .get("/products", () => {
    const products = getProducts();
    console.log(`[VS] Listing ${products.length} products`);
    return { products };
  })

  .post("/products", async ({ body, set }) => {
    const reqBody = body as { name?: string; imageBase64?: string };
    const { name, imageBase64 } = reqBody;

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
      console.log("[VS] Generating image embedding...");
      const embedding = await embedImage(imageBase64);

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

  .post("/search", async ({ body, set }) => {
    const reqBody = body as { imageBase64?: string; topK?: number };
    const { imageBase64, topK = 10 } = reqBody;

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
      console.log("[VS] Generating query image embedding...");
      const queryEmbedding = await embedImage(imageBase64);

      console.log("[VS] Computing similarities...");
      const scored = products.map((product) => ({
        product,
        score: cosineSimilarity(queryEmbedding, product.embedding),
      }));

      scored.sort((a, b) => b.score - a.score);
      const topResults = scored.slice(0, effectiveTopK);

      const results: SearchResult[] = topResults.map(({ product, score }) => ({
        product: toProductWithoutEmbedding(product),
        score: Math.round(score * 10_000) / 10_000,
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

  .post("/search/text", async ({ body, set }) => {
    const reqBody = body as { query?: string; topK?: number };
    const { query, topK = 10 } = reqBody;

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
      console.log("[VS] Generating query text embedding...");
      const queryEmbedding = await embedText(query.trim());

      console.log("[VS] Computing cross-modal similarities...");
      const scored = products.map((product) => ({
        product,
        score: cosineSimilarity(queryEmbedding, product.embedding),
      }));

      scored.sort((a, b) => b.score - a.score);
      const topResults = scored.slice(0, effectiveTopK);

      const results: SearchResult[] = topResults.map(({ product, score }) => ({
        product: toProductWithoutEmbedding(product),
        score: Math.round(score * 10_000) / 10_000,
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
