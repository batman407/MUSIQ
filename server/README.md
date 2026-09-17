# MUSIQ OMR Backend Service (Audiveris)

This service provides a headless, containerized REST API for Optical Music Recognition (OMR) using Audiveris.

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
Returns the status of the OMR service and whether the Audiveris CLI is connected.
```json
{
  "status": "ok",
  "service": "musiq-omr-backend",
  "engine": "Audiveris",
  "audiverisAvailable": true,
  "audiverisVersion": "audiveris 5.3.1"
}
```

### `POST /jobs`
Uploads a binary score file (PDF, PNG, JPG/JPEG).
- Request: `multipart/form-data` with field `file`.
- Response (201 Created):
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "uploaded"
}
```

### `GET /jobs/:id`
Polls the execution status of the recognition job.
- Status values: `uploaded` → `preprocessing` → `recognizing` → `exporting` → `completed` | `failed`.
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "originalFilename": "Great_Is_Thy_Faithfulness.pdf",
  "status": "recognizing",
  "progress": 45,
  "stageMessage": "Recognizing staves, clefs, barlines and pitches...",
  "error": null
}
```

### `GET /jobs/:id/result`
Retrieves the extracted, complete MusicXML string.
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "originalFilename": "Great_Is_Thy_Faithfulness.pdf",
  "format": "musicxml",
  "musicXml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

## Running with Docker (Recommended)

Run the containerized Audiveris engine with one command:

```bash
cd server
docker compose up --build
```

The server will be available at `http://localhost:3001`.

## Cloud Deployment

Deploy as a container to any of:
- **GCP Cloud Run**: `gcloud run deploy musiq-omr --source . --port 3001 --memory 4Gi`
- **AWS ECS / Fargate**: Deploy `Dockerfile` with minimum 2 vCPU and 4GB RAM.
- **Render / Railway**: Deploy as Docker Service.

Configure the client application environment:
```env
VITE_OMR_API_URL=https://your-omr-service.run.app
```
