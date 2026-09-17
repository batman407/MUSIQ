# MUSIQ OMR Backend Deployment Guide

This guide details how to build, deploy, and connect the production Audiveris Optical Music Recognition (OMR) backend for MUSIQ.

---

## 1. Overview & Architecture

MUSIQ relies on genuine Optical Music Recognition powered by **Audiveris 5.11.0** (with Tesseract OCR). Because Audiveris is a Java desktop/headless application with native dependencies (OpenCV, Tesseract, FreeType), it cannot run in a browser or inside lightweight serverless functions (e.g. AWS Lambda without custom containers, Vercel Serverless).

### Infrastructure Topology
```
[User Browser (MUSIQ SPA)]
      │
      │  POST /jobs (Multipart PDF / PNG / JPEG)
      ▼
[MUSIQ OMR Backend Container (Node.js + Express)]
      │
      │  spawn('audiveris', ['-batch', '-export', '-output', outDir, inputFile])
      ▼
[Audiveris 5.11.0 Headless Engine (Java 17 + Tesseract OCR)]
      │
      │  Writes .mxl / .musicxml
      ▼
[Backend extracts MusicXML string]
      │
      │  GET /jobs/:jobId -> { status: 'completed', musicXml: '<score-partwise>...' }
      ▼
[OpenSheetMusicDisplay (Client SVG Rendering & Audio Rehearsal)]
```

---

## 2. Resource & Hardware Requirements

| Resource | Minimum | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **RAM** | 2 GB | 4 GB - 8 GB | Multi-page PDFs and high-resolution score scans require significant memory during neural and pixel classification stages. |
| **vCPU** | 1 vCPU | 2 - 4 vCPU | OMR classification is heavily CPU-bound. 2+ vCPUs ensures single-page transcription finishes within 10–25 seconds. |
| **Disk** | 10 GB | 20 GB | For container image (~1.2 GB) plus temporary image/PDF processing workspace. |
| **OS Base** | Ubuntu 22.04 LTS (Jammy) | Ubuntu 22.04 LTS | The official `.deb` release target is Ubuntu 22.04. |
| **Java** | OpenJDK 17 | Eclipse Temurin 17 | Audiveris 5.11 requires Java 17+. |

---

## 3. Environment Variables

### Backend Environment Variables (`/server`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | HTTP port the Express server listens on. |
| `AUDIVERIS_BIN` | `/usr/local/bin/audiveris` | Absolute path to the Audiveris executable. |
| `JAVA_TOOL_OPTIONS` | `-Djava.awt.headless=true` | Forces Java AWT into headless mode, preventing X11 GUI errors in Linux containers. |
| `CORS_ORIGIN` | `*` (or specific frontend URL) | Set to your production frontend domain (e.g. `https://musiq.app`). |

### Frontend Environment Variable (`/`)
| Variable | Example | Description |
| :--- | :--- | :--- |
| `VITE_OMR_API_URL` | `https://omr.musiq.app` | Base URL of the deployed backend. If unset, the frontend defaults to `http://localhost:3001`. |

---

## 4. Deployment Platforms

### Option A: Railway (Recommended - Fastest Setup)
1. Fork or push the MUSIQ repository to GitHub.
2. In Railway Dashboard, click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Set **Root Directory** to `/server`.
5. Railway automatically detects `server/Dockerfile`.
6. Add Environment Variables:
   - `PORT`: `3001` (or let Railway assign automatically)
   - `JAVA_TOOL_OPTIONS`: `-Djava.awt.headless=true`
7. Under **Settings**, generate a public domain (e.g. `musiq-omr-production.up.railway.app`).
8. Verify deployment by visiting `https://<your-railway-domain>/health`.

---

### Option B: Render (Web Service with Docker)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Select **Docker** as the Runtime.
4. Set **Root Directory** to `server`.
5. Choose an instance type with **at least 2 GB RAM** (e.g., Standard or Pro plan).
6. Set Environment Variables:
   - `PORT`: `3001`
   - `JAVA_TOOL_OPTIONS`: `-Djava.awt.headless=true`
7. Deploy. Your service URL will be `https://<service-name>.onrender.com`.

---

### Option C: Google Cloud Run
Cloud Run runs container images serverlessly with full control over memory and CPU:
```bash
# 1. Build and push the image to Google Artifact Registry
docker build -t gcr.io/[PROJECT_ID]/musiq-omr:latest ./server
docker push gcr.io/[PROJECT_ID]/musiq-omr:latest

# 2. Deploy to Cloud Run with 4GB memory and 2 vCPUs
gcloud run deploy musiq-omr \
  --image gcr.io/[PROJECT_ID]/musiq-omr:latest \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars JAVA_TOOL_OPTIONS="-Djava.awt.headless=true" \
  --allow-unauthenticated
```

---

### Option D: Fly.io
1. Install `flyctl` and navigate to the `server` directory:
   ```bash
   cd server
   fly launch
   ```
2. In `fly.toml`, ensure VM memory is allocated:
   ```toml
   [vm]
     memory = "4096mb"
     cpus = 2
     cpu_kind = "shared"
   ```
3. Deploy:
   ```bash
   fly deploy
   ```

---

## 5. Local Docker Testing

If Docker is installed on your development machine, test the container locally:

```bash
cd server
docker build -t musiq-omr-server .
docker run -p 3001:3001 -e JAVA_TOOL_OPTIONS="-Djava.awt.headless=true" musiq-omr-server
```

---

## 6. Verification and Health Check

### Health Check Endpoint: `GET /health`
```bash
curl https://<YOUR_OMR_URL>/health
```
Expected healthy JSON response:
```json
{
  "status": "ok",
  "service": "musiq-omr-backend",
  "engine": "Audiveris",
  "audiverisAvailable": true,
  "audiverisVersion": "5.11.0",
  "timestamp": "2026-09-17T01:30:00.000Z"
}
```

### Job Submission Test: `POST /jobs`
```bash
curl -X POST https://<YOUR_OMR_URL>/jobs \
  -F "file=@test_score.png"
```
Expected response:
```json
{
  "jobId": "f7d23a10-e018-498b-b789-...",
  "status": "uploaded"
}
```

### Job Status Query: `GET /jobs/:jobId`
```bash
curl https://<YOUR_OMR_URL>/jobs/f7d23a10-e018-498b-b789-...
```
Expected response when complete:
```json
{
  "id": "f7d23a10-e018-498b-b789-...",
  "originalFilename": "test_score.png",
  "status": "completed",
  "progress": 100,
  "stageMessage": "OMR transcription complete",
  "musicXml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<score-partwise version=\"3.1\">...",
  "error": null
}
```

---

## 7. Connecting Frontend to Backend

In your frontend host (Vercel, Netlify, Cloudflare Pages, etc.):
1. Add environment variable:
   ```env
   VITE_OMR_API_URL=https://<YOUR_OMR_URL>
   ```
2. Redeploy the frontend.
3. Open MUSIQ in your browser, upload any score image or PDF. The application will post directly to your deployed OMR engine and stream real-time progress.
