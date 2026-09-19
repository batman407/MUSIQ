# MUSIQ OMR Backend Service (Audiveris)

Production-ready, containerized REST API for Optical Music Recognition (OMR) using Audiveris 5.11.0.

## Architecture

```
User PDF / Images (Client)
        ↓
POST /jobs (Multipart)
        ↓
Audiveris CLI (-batch -export)
        ↓
MusicXML / MXL File
        ↓
GET /jobs/:id/result
        ↓
MUSIQ React Application (OpenSheetMusicDisplay Notation & Audio)
```

## API Specification

### `GET /health`
Returns the status of the OMR service and whether Audiveris is callable.

**Healthy response (200):**
```json
{
  "status": "ok",
  "service": "musiq-omr-backend",
  "omr": "audiveris",
  "audiverisAvailable": true,
  "audiverisVersion": "5.11.0",
  "supabaseConnected": false,
  "activeJobs": 0,
  "maxConcurrentJobs": 3,
  "timestamp": "2026-09-19T08:00:00.000Z"
}
```

**Unhealthy response (503) — Audiveris not found:**
```json
{
  "status": "unhealthy",
  "audiverisAvailable": false
}
```

### `POST /jobs`
Uploads a binary score file (PDF, PNG, JPG/JPEG). Validates magic bytes.

- Request: `multipart/form-data` with field `file`.
- Response (201 Created):
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "queued"
}
```

### `GET /jobs/:id`
Polls the execution status of the recognition job.

Status values: `queued` → `processing` → `completed` | `failed`
```json
{
  "id": "3fa85f64-...",
  "originalFilename": "Great_Is_Thy_Faithfulness.pdf",
  "status": "processing",
  "stageMessage": "Recognizing musical symbols...",
  "error": null
}
```

### `GET /jobs/:id/result`
Retrieves the extracted, complete MusicXML string.
```json
{
  "jobId": "3fa85f64-...",
  "originalFilename": "Great_Is_Thy_Faithfulness.pdf",
  "format": "musicxml",
  "musicXml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

## Environment Variables

| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `3001` | HTTP port |
| `AUDIVERIS_BIN` | `/usr/local/bin/audiveris` | Path to Audiveris binary |
| `JAVA_TOOL_OPTIONS` | `-Djava.awt.headless=true` | Headless Java for containers |
| `CORS_ORIGIN` | `*` | Allowed origin(s), comma-separated |
| `NODE_ENV` | `development` | `production` strips stack traces |
| `MAX_FILE_SIZE_MB` | `50` | Upload file size limit |
| `MAX_CONCURRENT_JOBS` | `3` | Concurrent Audiveris processes |
| `JOB_CLEANUP_MINUTES` | `60` | Auto-clean completed jobs after N minutes |
| `SUPABASE_URL` | *(optional)* | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | *(optional)* | Server-only Supabase key |

## Running with Docker (Recommended)

```bash
cd server
docker compose up --build
```

Server available at `http://localhost:3001`.

## Deployment

### Railway (Recommended)
1. Push to GitHub
2. Railway Dashboard → New Project → Deploy from GitHub
3. Set **Root Directory** to `/server`
4. Railway detects the Dockerfile automatically
5. Add env vars: `CORS_ORIGIN=https://musiq-sooty.vercel.app`
6. Generate public domain → verify at `https://<domain>/health`

### Render
1. New Web Service → Docker runtime
2. Root directory: `server`
3. Minimum 2GB RAM instance
4. Set env vars

### Fly.io
```bash
cd server
fly launch
fly deploy
```
Ensure `fly.toml` has `memory = "4096mb"` and `cpus = 2`.

## Frontend Connection

Set in Vercel Environment Variables:
```
VITE_OMR_API_URL=https://YOUR_OMR_BACKEND_URL
```

## Security

- Helmet security headers
- Rate limiting (100 req/15min general, 20 uploads/15min)
- Magic byte file type validation
- Safe subprocess invocation (argument arrays, no shell)
- Path traversal prevention
- Stack trace stripping in production
- Periodic temp file cleanup
