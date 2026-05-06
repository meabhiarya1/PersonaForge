# PersonaForge Backend

Phase 1 backend for an AI video generation platform.

The user submits a topic, prompt, or notes. The backend creates a queued video generation job and runs this pipeline:

```text
User input
-> AI script
-> AI voice/audio
-> Avatar/lip-sync video
-> Captions
-> Final rendered MP4
```

## Tech Stack

- Node.js + Express
- MySQL
- Redis + BullMQ
- Bull Board dashboard
- FFmpeg
- OpenAI provider for script generation
- ElevenLabs provider for voice generation
- D-ID provider for avatar/lip-sync generation

## Project Structure

```text
Backend/
  src/
    app.js
    server.js
    config/
    routes/
    controllers/
    services/
    jobs/
    models/
    utils/
    validations/
    constants/
    temp/
```

The code follows this rule:

```text
route -> controller -> service
```

Routes only define endpoints. Controllers handle request and response. Services contain business logic. Provider-specific API calls stay inside each service's `providers` folder.

## Requirements

- Node.js 20+
- MySQL running locally or remotely
- Redis running locally or remotely
- FFmpeg installed

Check FFmpeg:

```bash
ffmpeg -version
```

Check Redis:

```bash
redis-cli ping
```

Expected:

```text
PONG
```

## Setup

From the repository root:

```bash
cd Backend
npm install
cp .env.example .env
```

Update `.env`:

```env
PORT=6001

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=persona_forge

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

OPENAI_API_KEY=
ELEVENLABS_API_KEY=
DID_API_KEY=

BASE_URL=http://localhost:6001
```

Do not use port `6000` in a browser. Many browsers block it as an unsafe port. Use `6001`, `5000`, or another allowed port.

The app creates the MySQL database and required tables automatically on startup if the configured MySQL user has permission.

## Run

Start the API server:

```bash
npm run dev
```

Start the BullMQ worker in another terminal:

```bash
npm run worker
```

Production-style server:

```bash
npm start
```

## BullMQ Dashboard

Open Bull Board:

```text
http://localhost:6001/admin/queues
```

It shows jobs from the `video-generation` queue, including waiting, active, completed, and failed jobs.

If the page does not load:

- Confirm the API server is running on the same port as `.env`.
- Confirm Redis is running.
- Restart `npm run dev` after changing `.env`.
- Use `/admin/queues`, not port `6000`.

## API Endpoints

### Health Check

```http
GET /health
```

Example:

```bash
curl http://localhost:6001/health
```

### Create Video Generation Job

```http
POST /api/videos/generate
```

Body:

```json
{
  "topic": "Explain JavaScript closures",
  "notes": "Explain in simple way with example",
  "language": "Hinglish",
  "duration": 60,
  "targetAudience": "beginner developers",
  "style": "educational",
  "avatarId": "default-avatar"
}
```

Example:

```bash
curl -X POST http://localhost:6001/api/videos/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Explain JavaScript closures",
    "notes": "Explain in simple way with example",
    "language": "Hinglish",
    "duration": 60,
    "targetAudience": "beginner developers",
    "style": "educational",
    "avatarId": "default-avatar"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Video generation started",
  "data": {
    "projectId": "exampleProjectId",
    "jobId": "exampleJobId"
  }
}
```

### Get Job Status

```http
GET /api/jobs/:jobId
```

Example:

```bash
curl http://localhost:6001/api/jobs/exampleJobId
```

Possible statuses:

```text
queued
processing
script_generated
voice_generated
avatar_generated
caption_generated
rendering
completed
failed
```

### Get Video Project

```http
GET /api/videos/:projectId
```

Example:

```bash
curl http://localhost:6001/api/videos/exampleProjectId
```

Returns project input, generated script, audio URL, avatar video URL, caption URL, final video URL, status, and error message if failed.

## BullMQ Flow

The queue implementation follows the create, add, and process pattern:

- Create queue: `src/jobs/queues/video.queue.js`
- Add job: `src/controllers/video.controller.js`
- Process job: `src/jobs/workers/video.worker.js`
- Pipeline logic: `src/jobs/processors/generateVideo.processor.js`

The worker runs:

```text
generateScript
-> generateVoice
-> generateAvatar
-> generateCaptions
-> renderFinalVideo
```

## Local File Storage

Generated files are stored locally:

```text
src/temp/audio/
src/temp/avatar/
src/temp/captions/
src/temp/final/
```

Public URLs are served from:

```text
/temp/...
```

This is intentionally simple for Phase 1. The `storage.service.js` file is the future replacement point for AWS S3 or another storage provider.

## Provider Notes

Provider-specific code lives here:

```text
src/services/script/providers/openai.provider.js
src/services/voice/providers/elevenlabs.provider.js
src/services/avatar/providers/did.provider.js
```

This makes it easier to replace:

- OpenAI with a local or fine-tuned LLM
- ElevenLabs with a local voice model
- D-ID with a local avatar/lip-sync model

When testing D-ID locally, `BASE_URL` must be publicly reachable because D-ID needs to fetch the generated audio URL. Use a tunnel such as ngrok and set:

```env
BASE_URL=https://your-ngrok-url.ngrok-free.app
```

## Troubleshooting

### Bull Board Shows Nothing

Check the correct URL:

```text
http://localhost:6001/admin/queues
```

Check Redis:

```bash
redis-cli ping
```

Create a job with `POST /api/videos/generate`, then refresh the dashboard.

### Browser Blocks Port

Avoid:

```text
PORT=6000
```

Use:

```text
PORT=6001
```

### Worker Does Not Process Jobs

Run the worker separately:

```bash
npm run worker
```

The API server only creates jobs. The worker processes them.

### MySQL Startup Fails

Check `.env` DB credentials and confirm MySQL is running. The configured user must be able to create the `persona_forge` database and tables.

## Scripts

```bash
npm run dev
npm start
npm run worker
```
