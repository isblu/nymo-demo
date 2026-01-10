const PYTHON_EMBED_URL =
  process.env.PYTHON_EMBED_URL ||
  "https://isblu--jina-clip-v2-fastapi-app.modal.run";

type EmbeddingResponse = {
  embedding: number[];
  dimensions: number;
};

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${PYTHON_EMBED_URL}/embed/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as EmbeddingResponse;
    console.log(
      `[Embeddings] Text: "${text.slice(0, 50)}..." -> ${data.dimensions} dims`
    );

    return data.embedding;
  } catch (error) {
    console.error("[Embeddings] Error generating text embedding:", error);
    throw error;
  }
}

export async function embedImage(imageBase64: string): Promise<number[]> {
  try {
    const response = await fetch(`${PYTHON_EMBED_URL}/embed/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as EmbeddingResponse;
    console.log(`[Embeddings] Image embedded -> ${data.dimensions} dims`);

    return data.embedding;
  } catch (error) {
    console.error("[Embeddings] Error generating image embedding:", error);
    throw error;
  }
}

let healthCache: { status: boolean; timestamp: number } | null = null;
const HEALTH_CACHE_TTL = 5 * 60 * 1000;

export async function checkEmbeddingsHealth(): Promise<boolean> {
  if (healthCache && Date.now() - healthCache.timestamp < HEALTH_CACHE_TTL) {
    return healthCache.status;
  }

  try {
    const response = await fetch(`${PYTHON_EMBED_URL}/health`, {
      method: "GET",
    });
    if (response.ok) {
      const data = await response.json();
      const status = (data as { model_loaded: boolean }).model_loaded === true;
      healthCache = { status, timestamp: Date.now() };
      return status;
    }
    healthCache = { status: false, timestamp: Date.now() };
    return false;
  } catch {
    healthCache = { status: false, timestamp: Date.now() };
    return false;
  }
}
