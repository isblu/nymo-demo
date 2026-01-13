import modal

# =============================================================================
# Configuration
# =============================================================================

MODEL_ID = "jinaai/jina-clip-v2"
MODEL_DIR = "/models"

# Create a persistent Volume for model weights (avoids re-downloading on cold start)
model_volume = modal.Volume.from_name("jina-clip-weights", create_if_missing=True)

# Container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "torchvision",
        "transformers",
        "Pillow",
        "numpy",
        "fastapi[standard]",
        "timm",
        "einops",
        "huggingface_hub",
    )
    # Prevent xformers from breaking CUDA detection during snapshotting
    .env({"XFORMERS_ENABLE_TRITON": "1"})
)

app = modal.App("jina-clip-v2", image=image)


# =============================================================================
# One-time model download function (run this first!)
# Usage: modal run modal-deploy.py::download_model
# =============================================================================


@app.function(volumes={MODEL_DIR: model_volume}, timeout=600)
def download_model():
    """Download model weights to Modal Volume. Run once before deploying."""
    from huggingface_hub import snapshot_download

    print(f"Downloading {MODEL_ID} to {MODEL_DIR}...")
    snapshot_download(
        repo_id=MODEL_ID,
        local_dir=f"{MODEL_DIR}/{MODEL_ID}",
        local_dir_use_symlinks=False,
    )
    model_volume.commit()  # Ensure changes are persisted
    print(f"Model downloaded to {MODEL_DIR}/{MODEL_ID}")


# =============================================================================
# Optimized Model Class with Memory Snapshots
# =============================================================================


@app.cls(
    gpu="T4",
    volumes={MODEL_DIR: model_volume},
    scaledown_window=3600,  # Keep container warm for 1 hour (max allowed) after last request
    enable_memory_snapshot=True,  # Enable memory snapshots for faster cold starts
    startup_timeout=180,  # Allow 3 min for model loading on cold start
)
@modal.concurrent(max_inputs=10)
class JinaClipModel:
    @modal.enter(snap=True)  # Runs BEFORE snapshot is taken - load model to CPU
    def load_model_cpu(self):
        """Load model to CPU memory. This state will be captured in the snapshot."""
        import torch
        from transformers import AutoModel

        print("Loading Jina CLIP v2 model to CPU (will be snapshotted)...")

        # Load from Volume (pre-downloaded) or fall back to HuggingFace
        model_path = f"{MODEL_DIR}/{MODEL_ID}"
        try:
            self.model = AutoModel.from_pretrained(
                model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16,
            )
            print(f"Loaded model from Volume: {model_path}")
        except Exception as e:
            print(f"Volume load failed ({e}), downloading from HuggingFace...")
            self.model = AutoModel.from_pretrained(
                MODEL_ID,
                trust_remote_code=True,
                torch_dtype=torch.float16,
            )

        self.model.eval()
        print("Model loaded to CPU!")

    @modal.enter(snap=False)  # Runs AFTER snapshot restore - move to GPU
    def move_to_gpu(self):
        """Move model to GPU and warm up. Runs after restoring from snapshot."""
        import torch

        print("Moving model to GPU...")
        if torch.cuda.is_available():
            self.model = self.model.cuda()
            print(f"Model moved to GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("Warning: CUDA not available, running on CPU")

        # Warm up: run dummy inference to compile CUDA kernels
        print("Warming up model...")
        with torch.no_grad():
            try:
                _ = self.model.encode_text(["warmup query"])
                print("Model warmed up and ready!")
            except Exception as e:
                print(f"Warmup failed (non-critical): {e}")

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


# =============================================================================
# FastAPI Web Endpoint
# =============================================================================


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
        return {"status": "ok", "model": MODEL_ID, "optimized": True}

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
