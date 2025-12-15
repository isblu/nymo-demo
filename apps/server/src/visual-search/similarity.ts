/**
 * Vector Similarity Utilities
 * Functions for computing similarity between embedding vectors
 */

/**
 * Compute dot product of two vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    sum += aVal * bVal;
  }
  return sum;
}

/**
 * Compute cosine similarity between two vectors
 * If vectors are already normalized (L2 norm = 1), this is just the dot product
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProd = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProd += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0;
  }

  return dotProd / magnitude;
}

/**
 * Find top K most similar items from a list
 */
export function topKSimilar<T>(
  query: number[],
  items: T[],
  getEmbedding: (item: T) => number[],
  k: number
): { item: T; score: number }[] {
  const scored = items.map((item) => ({
    item,
    score: cosineSimilarity(query, getEmbedding(item)),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}
