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

export async function checkEmbeddingsHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_EMBED_URL}/health`, {
      method: "GET",
    });
    if (response.ok) {
      const data = await response.json();
      return data.model_loaded === true;
    }
    return false;
  } catch {
    return false;
  }
}
