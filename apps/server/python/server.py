import base64
import os
from contextlib import asynccontextmanager
from io import BytesIO

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from transformers import AutoModel

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    
    # Force offline mode
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_HUB_OFFLINE"] = "1"
    
    print("[Embedding Server] Loading jina-clip-v2 model from local storage...")
    
    model_path = os.path.abspath("./jina-v2-local")
    model = AutoModel.from_pretrained(
        model_path,
        trust_remote_code=True,
        dtype=torch.float16,
        local_files_only=True,
    )
    
    if torch.cuda.is_available():
        model = model.cuda()
        print("[Embedding Server] Model loaded on CUDA GPU")
    else:
        print("[Embedding Server] Model loaded on CPU")
    
    model.eval()
    print("[Embedding Server] Model loaded successfully!")
    yield
    print("[Embedding Server] Shutting down...")


app = FastAPI(title="Jina CLIP Embedding Server", lifespan=lifespan)

# Enable CORS for the Elysia server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextEmbedRequest(BaseModel):
    text: str


class ImageEmbedRequest(BaseModel):
    imageBase64: str


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dimensions: int


def to_list(embedding) -> list[float]:
    """Convert embedding to list, handling both torch tensors and numpy arrays."""
    if isinstance(embedding, torch.Tensor):
        return embedding.cpu().numpy().tolist()
    elif isinstance(embedding, np.ndarray):
        return embedding.tolist()
    else:
        return list(embedding)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/embed/text", response_model=EmbeddingResponse)
async def embed_text(request: TextEmbedRequest):
    """Generate embedding for text."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        with torch.no_grad():
            embedding = model.encode_text([request.text])
            embedding_list = to_list(embedding[0])

        print(f"[Embed] Text: \"{request.text[:50]}...\" -> {len(embedding_list)} dims")
        return EmbeddingResponse(embedding=embedding_list, dimensions=len(embedding_list))

    except Exception as e:
        print(f"[Embed] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed/image", response_model=EmbeddingResponse)
async def embed_image(request: ImageEmbedRequest):
    """Generate embedding for base64 image."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Decode base64 image
        image_data = request.imageBase64
        if image_data.startswith("data:"):
            # Remove data URL prefix
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        with torch.no_grad():
            embedding = model.encode_image([image])
            embedding_list = to_list(embedding[0])

        print(f"[Embed] Image: {image.size} -> {len(embedding_list)} dims")
        return EmbeddingResponse(embedding=embedding_list, dimensions=len(embedding_list))

    except Exception as e:
        print(f"[Embed] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
