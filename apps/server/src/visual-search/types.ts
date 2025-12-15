/**
 * Visual Search Types
 * Core interfaces for the local visual search demo
 */

export type Product = {
  id: string;
  name: string;
  imageBase64: string;
  embedding: number[];
  createdAt: Date;
};

export type ProductWithoutEmbedding = {
  id: string;
  name: string;
  imageBase64: string;
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
