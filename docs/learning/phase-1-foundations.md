# Phase 1: PersonaForge Foundations

## Objective

Phase 1 proves one complete vertical slice:

```text
prompt -> script -> voice -> avatar -> captions -> final video
```

## Asynchronous jobs

Video generation is too slow for a normal HTTP request. The API therefore creates MySQL
project/job records and submits a BullMQ job. A separate worker performs paid AI and FFmpeg
work while the API remains responsive.

Relevant code:

- `Backend/src/controllers/video.controller.js`
- `Backend/src/jobs/queues/video.queue.js`
- `Backend/src/jobs/workers/video.worker.js`

## Provider abstraction

OpenAI, ElevenLabs, and D-ID calls live behind service/provider boundaries. Controllers never
call those APIs. This lets later phases replace a hosted provider with another API or a local
model without rewriting the HTTP layer.

## Real problems solved

### Database schema drift

The original project ID column was `VARCHAR(32)`, while UUIDs contain 36 characters. Table
creation with `IF NOT EXISTS` did not update the old table. Startup schema migration aligned
the existing database without deleting projects.

### FFmpeg subtitle support

The regular Homebrew FFmpeg build lacked the `subtitles` filter. PersonaForge now checks for
libass readiness and accepts explicit FFmpeg/FFprobe paths.

### Provider billing errors

HTTP 4xx responses are not retried because billing, permission, and validation errors cannot
be repaired by waiting. Network errors, rate limits, and server errors remain retryable.

### D-ID eventual completion

D-ID completed a Talk after the worker's polling timeout. A recovery command reused the paid
Talk instead of generating it again. This failure motivated the Phase 2 webhook architecture.
