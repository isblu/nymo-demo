# nymo-demo

A visual search demo application using **Jina CLIP v2** for image and text-based product search.

## Features

- 🖼️ **Visual Search**: Upload an image to find similar products
- 📝 **Text Search**: Describe what you're looking for in natural language  
- 📤 **Vendor Upload**: Add products to the catalog with automatic embedding generation
- 🧠 **AI-Powered**: Uses Jina CLIP v2 for multimodal embeddings

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | [Vercel] |
| Backend | https://nymo-backend-884619840600.us-central1.run.app |
| ML API | https://isblu--jina-clip-v2-fastapi-app.modal.run |

## Local Development

```bash
git clone https://github.com/isblu/nymo-demo.git
cd nymo-demo
bun install
```

Create `apps/server/.env`:
```env
PORT=3000
PYTHON_EMBED_URL=https://isblu--jina-clip-v2-fastapi-app.modal.run
```

Create `apps/web/.env`:
```env
VITE_SERVER_URL=http://localhost:3000
```

Run:
```bash
bun dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐ │
│  │   Vercel     │────▶│ Google Cloud Run │────▶│   Modal.com  │ │
│  │  (Frontend)  │     │    (Backend)     │     │   (ML API)   │ │
│  │              │     │                  │     │              │ │
│  │ React + Vite │     │  Bun + Elysia   │     │ Jina CLIP v2 │ │
│  └──────────────┘     └──────────────────┘     └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment

### Backend (Google Cloud Run)

```bash
gcloud run deploy nymo-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "PYTHON_EMBED_URL=https://isblu--jina-clip-v2-fastapi-app.modal.run" \
  --memory 512Mi \
  --port 8080
```

### Frontend (Vercel)

```bash
vercel -e VITE_SERVER_URL=https://nymo-backend-884619840600.us-central1.run.app
```

### ML Server (Modal.com)

The ML server is already deployed. To redeploy:

```bash
pip install modal
modal setup
modal deploy apps/server/python/modal_app.py
```

## Tech Stack

- **Frontend**: React, Vite, TanStack Router, Tailwind CSS
- **Backend**: Bun, Elysia, tRPC
- **ML**: Jina CLIP v2, Modal.com
- **Hosting**: Vercel, Google Cloud Run, Modal.com