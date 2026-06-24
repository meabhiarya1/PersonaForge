# PersonaForge Backend

Phase 1 backend for PersonaForge, an AI video generation platform.

The user submits a topic, prompt, or notes. The backend creates a queued job and runs this pipeline:

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
- MySQL with `mysql2/promise`
- Redis + BullMQ
- Bull Board dashboard
- FFmpeg

The FFmpeg build must include the `subtitles` filter (libass). Verify it with:

```bash
ffmpeg -hide_banner -filters | grep subtitles
```
- OpenAI provider for script generation
- ElevenLabs provider for voice generation
- D-ID provider for avatar/lip-sync generation

## Architecture

The API follows this flow:

```text
route -> controller -> service -> model SQL constants -> db query
```

The video generation pipeline follows this flow:

```text
route -> controller -> BullMQ queue -> worker -> processor -> script/voice/avatar/caption/render services
```

Controllers do not contain SQL queries or external API calls. Provider-specific API logic stays inside each service's `providers` folder so providers can be replaced later.

## Database Architecture

This backend uses MySQL, not MongoDB.

The files in `src/models` are MySQL table schema definitions, not MongoDB models and not ORM models.

```text
src/models/VideoProject.model.js
src/models/VideoJob.model.js
```

Each model file exports:

- table name
- column constants
- index names
- `CREATE TABLE` SQL

Database initialization lives in:

```text
src/config/db.js
```

It creates:

1. the configured database if it does not exist
2. `video_projects`
3. `video_jobs`

The `video_projects` table is created before `video_jobs` because `video_jobs.project_id` has a foreign key to `video_projects.id`.

Database operations live in:

```text
src/services/project/project.service.js
```

The service uses `mysql2/promise` and parameterized queries. SQL is not placed in controllers.

## Project Structure

```text
Backend/
  src/
    app.js
    server.js
    config/
      db.js
      redis.js
      bullBoard.js
    routes/
    controllers/
    services/
    jobs/
      queues/
      workers/
      processors/
    models/
    utils/
    validations/
    constants/
    temp/
```

## Requirements

- Node.js 20+
- MySQL
- Redis
- FFmpeg

Check Redis:

```bash
redis-cli ping
```

Expected:

```text
PONG
```

Check FFmpeg:

```bash
ffmpeg -version
```

## Setup

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
DB_PASSWORD=
DB_NAME=persona_forge

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
DID_API_KEY=
DID_POLL_INTERVAL_MS=5000
DID_TIMEOUT_MS=600000

BASE_URL=http://localhost:6001
ALLOW_MOCK_PROVIDERS=false
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

Set `ALLOW_MOCK_PROVIDERS=true` only for local infrastructure tests. Mock mode creates
valid silent audio and a timed placeholder avatar video, so the queue, captions, and
FFmpeg render can be tested without spending provider credits. With mock mode disabled,
missing provider credentials fail the job instead of returning a misleading completed result.

When using D-ID, `avatarId` must be a publicly accessible image URL and `BASE_URL` must
be publicly reachable so D-ID can download the generated audio.

Avoid `PORT=6000` in browsers. Many browsers block it as an unsafe port. Use `6001`, `5000`, or another allowed port.

## Run

Start the API server:

```bash
npm run dev
```

Start the BullMQ worker in another terminal:

```bash
npm run worker
```

Production-style start:

```bash
npm start
```

## Bull Board

Open the BullMQ dashboard:

```text
http://localhost:6001/admin/queues
```

It shows jobs from the `video-generation` queue, including waiting, active, completed, and failed jobs.

## API

### Health Check

```http
GET /health
```

```bash
curl http://localhost:6001/health
```

Readiness check (MySQL, Redis, FFmpeg, and provider configuration):

```http
GET /health/ready
```

### Create Video Job

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
    "projectId": "project-uuid",
    "jobId": "mysql-job-uuid",
    "queueJobId": "bullmq-job-id"
  }
}
```

### Get Job Status

```http
GET /api/jobs/:jobId
```

`jobId` is the MySQL job ID returned by `POST /api/videos/generate`.

```bash
curl http://localhost:6001/api/jobs/mysql-job-uuid
```

### Get Video Project

```http
GET /api/videos/:projectId
```

```bash
curl http://localhost:6001/api/videos/project-uuid
```

The response includes input fields, generated script data, audio URL, avatar video URL, caption URL, final video URL, status, and error message if failed.

## Status Values

Both project and job rows use the shared `JOB_STATUS` constants:

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

## BullMQ Flow

- Create queue: `src/jobs/queues/video.queue.js`
- Add job: `src/controllers/video.controller.js`
- Process job: `src/jobs/workers/video.worker.js`
- Pipeline logic: `src/jobs/processors/generateVideo.processor.js`

The worker updates both MySQL rows at every step:

```text
processing
script_generated
voice_generated
avatar_generated
caption_generated
rendering
completed
```

If any step fails, the worker marks both the project and job as `failed`, saves `error_message`, and rethrows the error so BullMQ marks the queue job failed.

## Local File Storage

Generated files are stored locally:

```text
src/temp/audio/
src/temp/avatar/
src/temp/captions/
src/temp/final/
```

They are served publicly from:

```text
/temp/...
```

This is intentionally simple for Phase 1. `src/services/storage/storage.service.js` is the replacement point for S3 or another storage provider later.

## Provider Notes

Provider code lives here:

```text
src/services/script/providers/openai.provider.js
src/services/voice/providers/elevenlabs.provider.js
src/services/avatar/providers/did.provider.js
```

Current Phase 1 uses external APIs, but providers are replaceable later:

- OpenAI can be replaced by a local or fine-tuned LLM.
- ElevenLabs can be replaced by a local voice model.
- D-ID can be replaced by a local avatar/lip-sync model.

D-ID requires a public `BASE_URL` during local testing because it must fetch the generated audio URL. Use a tunnel such as ngrok:

```env
BASE_URL=https://your-ngrok-url.ngrok-free.app
```

## Troubleshooting

### Bull Board Does Not Show Jobs

Open:

```text
http://localhost:6001/admin/queues
```

Make sure Redis is running:

```bash
redis-cli ping
```

Create a job using `POST /api/videos/generate`, then refresh Bull Board.

### Worker Does Not Process Jobs

The API server only creates jobs. The worker processes jobs.

Run:

```bash
npm run worker
```

### MySQL Fails On Startup

Check `.env` DB credentials and confirm MySQL is running. The configured user must be able to create the database and tables.

If you previously ran an older development schema, recreate or migrate the local tables so they match the SQL definitions in `src/models`.

## Scripts

```bash
npm run dev
npm start
npm run worker
```
