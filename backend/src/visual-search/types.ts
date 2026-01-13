export type { Product, NewProduct } from "../db/schema";

export type ProductWithoutEmbedding = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Date;
};

export type SearchResult = {
  product: ProductWithoutEmbedding;
  score: number;
};

export type AddProductRequest = {
  name: string;
  imageBase64: string;
};

export type AddProductResponse = {
  product: ProductWithoutEmbedding;
};

export type SearchRequest = {
  imageBase64: string;
  topK?: number;
};

export type TextSearchRequest = {
  query: string;
  topK?: number;
};

export type SearchResponse = {
  results: SearchResult[];
};
