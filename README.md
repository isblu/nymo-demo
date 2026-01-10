# nymo-demo

A visual search demo application using **Jina CLIP v2** for image and text-based product search.

## Features

- 🖼️ **Visual Search**: Upload an image to find similar products
- 📝 **Text Search**: Describe what you're looking for in natural language
- 📤 **Vendor Upload**: Add products to the catalog with automatic embedding generation
- 🧠 **AI-Powered**: Uses Jina CLIP v2 for multimodal embeddings

## Live Demo

| Service  | URL                                               |
| -------- | ------------------------------------------------- |
| Frontend | https://nymo-demo.vercel.app/                     |
| Backend  | https://nymo-demo-backend.vercel.app              |
| ML API   | https://isblu--jina-clip-v2-fastapi-app.modal.run |

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
- **Hosting**: Vercel, Modal.com
