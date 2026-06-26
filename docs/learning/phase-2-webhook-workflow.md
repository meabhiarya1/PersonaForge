# Phase 2: D-ID Webhook and Resumable Workflow

## Problem

Blocking polling holds the only worker slot while D-ID processes a video. A restart loses the
in-memory Talk ID, and a retry can accidentally purchase the same avatar twice.

## Concepts

- **Webhook:** D-ID calls PersonaForge when external work changes state.
- **Checkpoint:** `video_job_steps` stores progress and provider IDs in MySQL.
- **Idempotency:** duplicate webhook deliveries enqueue at most one continuation job.
- **At-least-once delivery:** webhook providers and queues may deliver the same event again.
- **Reconciliation:** delayed status checks recover when a webhook is lost.

## PersonaForge flow

```text
generate-video job
  -> OpenAI script
  -> ElevenLabs audio
  -> POST D-ID Talk with webhook
  -> save talkId
  -> status awaiting_avatar
  -> release worker

D-ID webhook or delayed check
  -> look up talkId checkpoint
  -> fetch Talk directly from D-ID (authoritative verification)
  -> enqueue deterministic continue-video job
  -> download avatar
  -> captions
  -> FFmpeg render
  -> completed
```

## Where the webhook URL is configured

It is sent inside every D-ID Create Talk request:

```text
${BASE_URL}/api/webhooks/did
```

There is no separate dashboard configuration. During local development, `BASE_URL` is the
active Cloudflare Tunnel URL and the tunnel must stay running.

## Security

The incoming body is treated as an untrusted notification. PersonaForge finds the persisted
Talk ID and calls D-ID's authenticated `GET /talks/:id` endpoint before changing project state.
The webhook never performs FFmpeg work directly; it acknowledges quickly and queues work.

## Fallback

A delayed BullMQ status check runs every `DID_FALLBACK_INTERVAL_MS`. It only reads the Talk;
it never creates another paid D-ID generation. If the webhook arrives first, the deterministic
continuation job ID prevents duplication.
