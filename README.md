# nymo-demo

A visual search demo application using **Jina CLIP v2** for image and text-based product search.

## Features

- 🖼️ **Visual Search**: Upload an image to find similar products
- 📝 **Text Search**: Describe what you're looking for in natural language
- 📤 **Vendor Upload**: Add products to the catalog with automatic embedding generation
- 🧠 **AI-Powered**: Uses Jina CLIP v2 for multimodal embeddings

## Quick Start (Cloud - Recommended)

Use Modal.com for ML embeddings (no local Python/GPU required):

```bash
git clone https://github.com/isblu/nymo-demo.git
cd nymo-demo
bun i
```

Create `apps/server/.env`:
```env
PORT=3000
USE_MODAL_EMBEDDINGS=true
PYTHON_EMBED_URL=https://isblu--jina-clip-embeddings-fastapi-app.modal.run
```

Run:
```bash
bun dev
```

## Local Development (with Python)

If you want to run the ML server locally:

### 1. Install dependencies
```bash
git clone https://github.com/isblu/nymo-demo.git
cd nymo-demo
bun i
```

### 2. Setup Python Environment
```bash
cd apps/server/python
py -m venv .jina_env
.\.jina_env\Scripts\Activate.ps1  # Windows
# source .jina_env/bin/activate   # Linux/Mac
python.exe -m pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu 
pip install -r requirements.txt
cd ../../..
```

### 3. Run (Local Mode)
Create `apps/server/.env`:
```env
PORT=3000
USE_MODAL_EMBEDDINGS=false
PYTHON_EMBED_URL=http://localhost:8001
```

```bash
bun dev
```

This starts both the web server and backend server (which spawns the local Python ML server).

## Deploy to Modal.com

To deploy your own Modal.com embedding endpoint:

```bash
cd apps/server/python
pip install modal
modal setup
modal deploy modal_app.py
```

Your endpoint will be at: `https://YOUR_USERNAME--jina-clip-embeddings-fastapi-app.modal.run`

## Architecture

```
Frontend (Vite + React)
    ↓
Backend (Bun + Elysia)
    ↓
ML Server (Python FastAPI + Jina CLIP v2)
    - Local: apps/server/python/server.py
    - Cloud: Modal.com (modal_app.py)
```

## Hosting Recommendations

| Component | Free Option | Paid Option |
|-----------|-------------|-------------|
| Frontend | Vercel, Cloudflare Pages | - |
| Backend | Google Cloud Run, Railway | Railway Pro |
| ML Server | Modal.com ($30 free credits) | Modal.com, Replicate | 