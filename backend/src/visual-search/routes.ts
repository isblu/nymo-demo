import { Elysia } from "elysia";
import { deleteProductImage, uploadProductImage } from "../storage";
import { checkEmbeddingsHealth, embedImage, embedText } from "./embeddings";
import {
  addProduct,
  deleteProduct,
  findSimilarProducts,
  getProductCount,
  getProducts,
} from "./store";
import type {
  AddProductResponse,
  ProductWithoutEmbedding,
  SearchResponse,
} from "./types";

function toProductWithoutEmbedding(product: {
  id: string;
  name: string;
  imageUrl: string;
  embedding: number[];
  createdAt: Date;
}): ProductWithoutEmbedding {
  const { embedding: _, ...rest } = product;
  return rest;
}

export const visualSearchRoutes = new Elysia({ prefix: "/vs" })
  .get("/health", async () => {
    const embeddingsOk = await checkEmbeddingsHealth();
    const productCount = await getProductCount();

    return {
      status: "ok",
      services: {
        embeddings: embeddingsOk ? "connected" : "unavailable",
      },
      productCount,
    };
  })

  .get("/products", async () => {
    const products = await getProducts();
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
      // Generate a UUID for the product first (needed for image path)
      const productId = crypto.randomUUID();

      // Generate image embedding
      console.log("[VS] Generating image embedding...");
      const embedding = await embedImage(imageBase64);

      // Upload image to Supabase Storage
      console.log("[VS] Uploading image to storage...");
      const imageUrl = await uploadProductImage(imageBase64, productId);

      // Save product to database
      const product = await addProduct({
        id: productId,
        name: name.trim(),
        imageUrl,
        embedding,
      });

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

  .delete("/products/:id", async ({ params, set }) => {
    const { id } = params;

    if (!id || typeof id !== "string") {
      set.status = 400;
      return { error: "Invalid request", message: "Product ID is required" };
    }

    console.log(`[VS] Deleting product: ${id}`);

    try {
      // Delete from database
      const deleted = await deleteProduct(id);

      if (!deleted) {
        set.status = 404;
        return { error: "Not found", message: "Product not found" };
      }

      // Delete image from storage (fire and forget - don't fail if image delete fails)
      deleteProductImage(id).catch((err) => {
        console.error("[VS] Failed to delete image from storage:", err);
      });

      console.log(`[VS] Product deleted: ${id}`);
      return { success: true, message: "Product deleted successfully" };
    } catch (error) {
      console.error("[VS] Error deleting product:", error);
      set.status = 500;
      return {
        error: "Failed to delete product",
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

    try {
      // Generate query image embedding
      console.log("[VS] Generating query image embedding...");
      const queryEmbedding = await embedImage(imageBase64);

      // Find similar products using pgvector
      console.log("[VS] Searching for similar products...");
      const results = await findSimilarProducts(queryEmbedding, effectiveTopK);

      if (results.length === 0) {
        console.log("[VS] No products found");
        return {
          results: [],
          message: "No products in the database yet",
        };
      }

      console.log(
        `[VS] Found ${results.length} results, top score: ${results[0]?.score}`
      );

      const response: SearchResponse = { results };
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

    try {
      // Generate query text embedding
      console.log("[VS] Generating query text embedding...");
      const queryEmbedding = await embedText(query.trim());

      // Find similar products using pgvector (cross-modal search)
      console.log("[VS] Searching for similar products...");
      const results = await findSimilarProducts(queryEmbedding, effectiveTopK);

      if (results.length === 0) {
        console.log("[VS] No products found");
        return {
          results: [],
          message: "No products in the database yet",
        };
      }

      console.log(
        `[VS] Found ${results.length} results, top score: ${results[0]?.score}`
      );

      return { results };
    } catch (error) {
      console.error("[VS] Error during text search:", error);
      set.status = 500;
      return {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
