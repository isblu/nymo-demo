import modal

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch",
    "torchvision",
    "transformers",
    "Pillow",
    "numpy",
    "fastapi[standard]",
    "timm", 
    "einops", 
)

app = modal.App("jina-clip-v2", image=image)


@app.cls(
    gpu="T4", 
    scaledown_window=300,  
)
@modal.concurrent(max_inputs=10) 
class JinaClipModel:
    @modal.enter()
    def load_model(self):
        import torch
        from transformers import AutoModel

        print("Loading Jina CLIP v2 model...")
        self.model = AutoModel.from_pretrained(
            "jinaai/jina-clip-v2",
            trust_remote_code=True,
            dtype=torch.float16,  
        )
        if torch.cuda.is_available():
            self.model = self.model.cuda()
        self.model.eval()
        print("Model loaded!")

    @modal.method()
    def embed_text(self, text: str) -> list[float]:
        import numpy as np
        import torch

        with torch.no_grad():
            embedding = self.model.encode_text([text])
            vec = embedding[0]
            if isinstance(vec, np.ndarray):
                return vec.tolist()
            return vec.cpu().numpy().tolist()

    @modal.method()
    def embed_image(self, image_base64: str) -> list[float]:
        import base64
        from io import BytesIO

        import numpy as np
        import torch
        from PIL import Image

        image_data = image_base64
        if image_data.startswith("data:"):
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        with torch.no_grad():
            embedding = self.model.encode_image([image])
            vec = embedding[0]
            if isinstance(vec, np.ndarray):
                return vec.tolist()
            return vec.cpu().numpy().tolist()


@app.function()
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    web_app = FastAPI(title="Jina CLIP Embedding API")

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    model = JinaClipModel()

    class TextRequest(BaseModel):
        text: str

    class ImageRequest(BaseModel):
        imageBase64: str

    class EmbeddingResponse(BaseModel):
        embedding: list[float]
        dimensions: int

    @web_app.get("/health")
    def health():
        return {"status": "ok", "model_loaded": True}

    @web_app.post("/embed/text", response_model=EmbeddingResponse)
    def embed_text_endpoint(request: TextRequest):
        try:
            embedding = model.embed_text.remote(request.text)
            return EmbeddingResponse(embedding=embedding, dimensions=len(embedding))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.post("/embed/image", response_model=EmbeddingResponse)
    def embed_image_endpoint(request: ImageRequest):
        try:
            embedding = model.embed_image.remote(request.imageBase64)
            return EmbeddingResponse(embedding=embedding, dimensions=len(embedding))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return web_app