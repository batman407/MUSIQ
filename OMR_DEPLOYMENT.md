# MUSIQ OMR Backend Deployment Guide

Production deployment guide for the Audiveris Optical Music Recognition backend.

---

## 1. Architecture

```
[MUSIQ React SPA — Vercel]
        │
        │  POST /jobs (multipart PDF / PNG / JPEG)
        ▼
[MUSIQ OMR Backend Container — Railway / Render / Fly.io]
        │
        ├─ Supabase (optional): store projects, jobs, results
        │
        │  spawn('audiveris', ['-batch', '-export', '-output', outDir, inputFile])
        ▼
[Audiveris 5.11.0 Headless — Java 17 + Tesseract OCR]
        │
        │  Writes .mxl / .musicxml
        ▼
[Backend extracts MusicXML, stores in Supabase Storage]
        │
        │  GET /jobs/:id → { status: 'completed' }
        │  GET /jobs/:id/result → { musicXml: '<score-partwise>...' }
        ▼
[OpenSheetMusicDisplay — Client SVG Rendering & Audio]
```

---

## 2. Requirements

| Resource | Minimum | Recommended |
|:---|:---|:---|
| RAM | 2 GB | 4-8 GB |
| vCPU | 1 | 2-4 |
| Disk | 10 GB | 20 GB |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |
| Java | OpenJDK 17 | Eclipse Temurin 17 |

---

## 3. Quick Start — Railway (Recommended)

1. Push the MUSIQ repo to GitHub
2. Railway Dashboard → **New Project** → **Deploy from GitHub**
3. Set **Root Directory** to `/server`
4. Railway auto-detects `server/Dockerfile`
5. Set Environment Variables:
   ```
   CORS_ORIGIN=https://musiq-sooty.vercel.app
   JAVA_TOOL_OPTIONS=-Djava.awt.headless=true
   ```
6. Generate public domain
7. Verify: `curl https://<domain>/health`

---

## 4. Other Platforms

### Render
- New Web Service → Docker runtime → root dir `server`
- Minimum 2GB RAM instance (Standard plan or higher)

### Fly.io
```bash
cd server
fly launch
# In fly.toml, set memory=4096mb, cpus=2
fly deploy
```

### Google Cloud Run
```bash
docker build -t gcr.io/[PROJECT]/musiq-omr:latest ./server
docker push gcr.io/[PROJECT]/musiq-omr:latest
gcloud run deploy musiq-omr \
  --image gcr.io/[PROJECT]/musiq-omr:latest \
  --memory 4Gi --cpu 2 --timeout 300 \
  --set-env-vars JAVA_TOOL_OPTIONS="-Djava.awt.headless=true" \
  --allow-unauthenticated
```

---

## 5. Local Docker Testing

```bash
cd server
docker build -t musiq-omr-server .
docker run -p 3001:3001 \
  -e JAVA_TOOL_OPTIONS="-Djava.awt.headless=true" \
  musiq-omr-server

# Health check
curl http://localhost:3001/health

# Submit a score
curl -X POST http://localhost:3001/jobs -F "file=@test_score.pdf"

# Poll status
curl http://localhost:3001/jobs/<jobId>

# Get result
curl http://localhost:3001/jobs/<jobId>/result
```

---

## 6. Connect Frontend to Backend

In **Vercel Dashboard** → Environment Variables:
```
VITE_OMR_API_URL=https://YOUR_DEPLOYED_OMR_URL
```

Redeploy the frontend after setting this variable.

---

## 7. Environment Variables Reference

See [`server/.env.example`](server/.env.example) for the complete list.

Key variables:
| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `*` | Production frontend URL |
| `SUPABASE_URL` | *(optional)* | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | *(optional)* | Server-only Supabase key |
| `MAX_CONCURRENT_JOBS` | `3` | Concurrent OMR processes |

---

## 8. Supabase Setup (Optional)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run [`server/schema.sql`](server/schema.sql) in the SQL Editor
3. Create storage buckets: `original-scores` (private), `transcriptions` (private)
4. Set env vars on your backend host:
   ```
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
