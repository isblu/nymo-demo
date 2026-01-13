import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// Embedding dimension for Jina CLIP v2 model (1024-dimensional vectors)
export const EMBEDDING_DIMENSIONS = 1024;

// Products table with vector embeddings for visual search
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // HNSW index for fast approximate nearest neighbor search using cosine distance
    index("products_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

// Type inference helpers
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
