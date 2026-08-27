# MediSync Backend

FastAPI backend powering the **AI Shift-Handoff & Discharge Copilot**. It exposes a REST API for document ingestion, hybrid RAG retrieval, and structured clinical-summary generation.

> ⚠️ Prototype build. Some services are stubbed — see *Implementation Status*.

---

## Overview

The backend implements a hybrid RAG pipeline:

1. **Ingest** — accept CSV/JSON/PDF/TXT/image uploads, extract text, anonymize PII.
2. **Chunk** — split documents into overlapping segments.
3. **Embed** — local HuggingFace `all-MiniLM-L6-v2` embeddings (CUDA or CPU).
4. **Store** — ChromaDB (vector) + `rank-bm25` (keyword) indexes.
5. **Retrieve** — hybrid search via Reciprocal Rank Fusion.
6. **Generate** — Cohere LLM returns JSON-structured summaries with `[CHUNK_ID]` citations.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| API framework | FastAPI + Uvicorn (ASGI) |
| Validation | Pydantic / pydantic-settings |
| CORS | fastapi-cors |
| RAG orchestration | LangChain |
| Embeddings | sentence-transformers + langchain-huggingface |
| Vector store | ChromaDB |
| Keyword search | rank-bm25 |
| LLM | Cohere (`command-r` / `command-r7b-12-2024`) |
| PII (planned) | Microsoft Presidio + spaCy |
| File parsing | pypdf, python-docx, beautifulsoup4, pandas |

---

## Prerequisites

- Python **3.10+**
- pip
- (Optional) NVIDIA CUDA GPU for faster embeddings; CPU fallback is automatic.

---

## Installation

```bash
cd backend

# 1. Virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r ../requirements.txt

# 3. Environment configuration
cp ../.env.example ../.env
#    Edit ../.env and set COHERE_API_KEY
```

> The root `.env` is loaded by `backend/core/config.py` (`env_file=".env"`). Keep it at the project root, not inside `backend/`.

---

## Configuration

Copy `.env.example` → `.env` and set:

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `True` | Debug mode |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Server bind |
| `COHERE_API_KEY` | _(empty)_ | **Required** for generation |
| `COHERE_MODEL` | `command-r` | Cohere model id |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Local embedding model |
| `EMBEDDING_DEVICE` | `cuda` | `cuda` or `cpu` |
| `EMBEDDING_BATCH_SIZE` | `32` | Embedding batch size |
| `CHUNK_SIZE` | `512` | Chunk token size |
| `CHUNK_OVERLAP` | `100` | Chunk overlap |
| `DATA_DIR` | `data` | Base data dir |
| `UPLOAD_DIR` | `data/uploads` | Uploaded files |
| `EMBEDDINGS_DIR` | `data/embeddings` | Embedding cache |
| `CHROMA_PERSIST_DIRECTORY` | `data/embeddings/chromadb` | ChromaDB path |
| `CORS_ORIGINS` | localhost origins | Allowed frontends (see `core/config.py`) |

> **Note:** `core/config.py` defaults `COHERE_MODEL` to `command-r`, while `services/rag_pipeline.py` uses `command-r7b-12-2024`. Set the same value in `.env` to avoid confusion.

---

## Running

```bash
# From project root (so .env and data/ resolve correctly)
cd backend
uvicorn main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- Root info: http://localhost:8000/

---

## API Endpoints

All routes are prefixed with `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe |
| GET | `/documents` | List documents (filter `?patient_id=`) |
| POST | `/documents` | Create document from raw text |
| GET | `/documents/{id}` | Get a document |
| DELETE | `/documents/{id}` | Delete a document |
| POST | `/documents/{id}/chunk` | Chunk a document for embedding |
| POST | `/upload` | Upload a file (PDF/PNG/JPG/TIFF/CSV/JSON/TXT, ≤50MB) |
| POST | `/upload/batch` | Batch upload |
| POST | `/summary/generate` | Generate discharge/handoff summary |
| GET | `/summary` | List summaries |
| GET | `/summary/{id}` | Get a summary |
| PUT | `/summary/{id}/edit` | Edit a summary |
| POST | `/summary/{id}/sign-off` | Doctor sign-off |

### Example: upload + generate

```bash
# Upload a clinical note
curl -F "file=@/path/to/note.txt" http://localhost:8000/api/v1/upload/

# Generate a discharge summary
curl -X POST http://localhost:8000/api/v1/summary/generate \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"p1","document_ids":["<file_id>"],"summary_type":"discharge"}'
```

---

## Directory Structure

```
backend/
├── main.py                 # FastAPI app, CORS, router registration
├── core/
│   └── config.py           # Settings (pydantic-settings) + dir setup
├── api/
│   ├── health.py           # /health, /ready
│   ├── documents.py        # document CRUD (in-memory store)
│   ├── upload.py           # file upload + ingestion
│   └── summary.py          # summary generation endpoints
├── services/
│   ├── ingestion.py        # text extraction, PII stub, chunking
│   ├── rag.py              # RAG service (currently stubbed)
│   ├── rag_pipeline.py     # fully functional standalone RAG demo
│   └── generation.py       # LLM summary generation (mock by default)
└── data/                   # created at runtime: uploads/, embeddings/
```

---

## External Services & Credentials

| Service | Required? | Notes |
|---------|-----------|-------|
| **Cohere API** | Yes (generation) | Get key at https://dashboard.cohere.com/ → `COHERE_API_KEY` |
| Microsoft Presidio + spaCy | No (stub) | `python -m spacy download en_core_web_lg` when enabled |
| Celery / Redis | No (planned) | Background task queue not yet implemented |

---

## Implementation Status

- ✅ API surface, health checks, upload, in-memory document store.
- ✅ `services/rag_pipeline.py` — real embeddings + ChromaDB + Cohere demo (`python -m backend.services.rag_pipeline`).
- ⚠️ `services/rag.py` and `services/generation.py` are **placeholders** — the API's `/summary/generate` currently returns mock output and must be wired to `rag_pipeline.py`.
- ⚠️ `anonymize_pii()` is a no-op; PDF/image OCR are stubs.
- ❌ No persistent database (data lives in Python dicts; lost on restart).

---

## Testing

`requirements.txt` includes `pytest` / `pytest-asyncio`. Sample fixtures live in the repo-root `tests/` directory (`john_doe_*.txt`). Add backend tests under a `tests/` module and run:

```bash
pytest
```
