/**
 * Visual Search API Configuration
 */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  /** GET all products, POST to add new product */
  products: `${SERVER_URL}/vs/products`,
  /** POST image search */
  search: `${SERVER_URL}/vs/search`,
  /** POST text search */
  textSearch: `${SERVER_URL}/vs/search/text`,
  /** GET health check */
  health: `${SERVER_URL}/vs/health`,
};

export type ProductWithoutEmbedding = {
  id: string;
  name: string;
  imageBase64: string;
  createdAt: string;
};

export type SearchResult = {
  product: ProductWithoutEmbedding;
  score: number;
};

export type SearchResponse = {
  results: SearchResult[];
  message?: string;
};

export type AddProductResponse = {
  product: ProductWithoutEmbedding;
};

export type ProductsResponse = {
  products: ProductWithoutEmbedding[];
};

/**
 * Convert a File to JPEG base64 data URL
 * Uses canvas to convert any image format to JPEG for better compatibility
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Resize if too large (max 1024px on longest side)
      const maxSize = 1024;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      resolve(jpegDataUrl);
    };
    img.onerror = () => reject(new Error("Failed to load image"));

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
