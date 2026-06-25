# PersonaForge Phases and AI/ML Learning Roadmap

This roadmap combines two tracks:

1. **Product implementation:** what PersonaForge should build phase by phase.
2. **AI/ML learning:** what a full-stack/MERN developer should learn while building each
   part.

The long-term vision is a personal AI content creator system:

```text
idea / notes / article / reference video
  -> understand content
  -> rewrite in creator style
  -> generate voice
  -> generate avatar/lip-sync/body movement
  -> render final edited video
```

The practical rule is:

```text
API first for speed.
Provider abstraction for replacement.
Open-source/exportable/local models later for ownership and cost control.
```

## Current Strategy

PersonaForge should not start with full model training. Training voice, face, and full-body
gesture models is expensive and slow. The project should first prove the full product flow
with APIs, then replace selected parts with custom/exportable models later.

For every AI provider or model we evaluate later, check:

- Can we customize or train it?
- Can we export/download the model or weights?
- Can it run locally?
- What GPU/RAM is required?
- What is the license?
- What is the training cost?
- What is the inference cost per video?

Cost rule:

- Generate low-cost previews first.
- Render final video only after approval.
- Cache/reuse scripts, voice, avatar, captions, and rendered assets.
- Train once, reuse many times.

## Phase v1: Simple MVP / Foundation Prototype

Goal:

```text
prompt / notes -> script -> voice -> avatar -> captions -> final MP4
```

Status: completed.

Built:

- Prompt-based video input form
- Backend video generation API
- MySQL project/job records
- Redis + BullMQ background worker
- OpenAI script generation
- ElevenLabs text-to-speech
- D-ID avatar/lip-sync generation
- FFmpeg caption/final video rendering
- Local temp file storage
- Health and readiness checks
- Provider readiness checks
- FFmpeg/libass readiness validation
- Basic job/project status tracking
- Mock provider mode for local testing

Why this phase matters:

This proves the complete vertical slice. Even if providers change later, the product pipeline
is now real.

AI/ML learning topics:

- LLM API basics
- Prompt-to-script generation
- TTS basics
- Avatar/lip-sync API basics
- Captions/SRT
- FFmpeg rendering
- Inference vs training

Full-stack learning topics:

- Route -> controller -> service architecture
- Async API design
- Queue workers with BullMQ
- MySQL schema design
- Redis job queues
- Provider abstraction
- Environment/secrets handling
- Cloudflare Tunnel for local public callbacks

## Phase v2: Reliable Workflow and Creator Style Profile

Goal:

Make the MVP reliable and reusable before adding bigger AI/ML features.

Status: in progress.

Completed:

- D-ID webhook endpoint
- D-ID Talk ID checkpointing in MySQL
- `video_job_steps` table
- `awaiting_avatar` status
- Worker releases after D-ID Talk creation
- Webhook continuation job
- Delayed fallback D-ID status check
- Duplicate webhook protection through deterministic queue job IDs
- Better D-ID provider error messages
- Creator Style Profile MVP
- Profile CRUD APIs
- Profile selector in generation UI
- Apply profile defaults to generation form
- React Router page separation with left sidebar navigation
- Project output polish with copyable Project ID / Job ID
- Clearer empty and failed project states
- Generated media/debug links in the output panel
- Video Library page for completed videos with large preview and created date/time
- Learning docs for Phase 1 and Phase 2 webhook flow

Remaining:

- Final Phase v2 testing checklist
- Optional controlled retry endpoint for failed generations
- Optional temp/intermediate media cleanup after permanent storage decision

Creator Style Profile MVP fields:

- Profile name
- Preferred language
- Target audience
- Default style
- Default duration
- Default avatar ID
- Default voice ID
- Tone/notes preference
- Common phrases
- Teaching style
- Hook style

AI/ML learning topics:

- Few-shot prompting
- Style transfer through prompts
- System prompts
- Prompt templates
- Fine-tuning vs prompting
- Dataset preparation basics

Full-stack learning topics:

- CRUD APIs
- Form defaults and reusable profile state
- Idempotency
- Webhooks
- Fallback polling
- Checkpoint/recovery workflow

Not included in Phase v2:

- Authentication
- Payments
- Permanent cloud storage
- Detailed cost dashboard
- Personal voice cloning
- Personal face/full-body avatar
- Reference video/article analysis
- Real fine-tuning

## Phase v3: Content Understanding and Reference Analyzer

Goal:

User can give richer inputs, and PersonaForge should understand them before generating a
script.

Inputs:

- Topic or idea
- Notes / bullet points
- Article/blog URL
- PDF/docs
- Code snippets
- Screenshots/images
- Reference video link
- News/trending topic
- Target audience
- Platform: YouTube, Shorts, Reels
- Duration
- Language: English, Hindi, Hinglish

Build:

- Input processor
- Content summarizer
- Key-point extractor
- Script generator improvement
- Scene planner
- Hook/title/description/hashtag suggestions
- Basic reference source storage

AI/ML learning topics:

- LLM basics deeper
- Text summarization
- Extraction vs generation
- RAG basics
- Embeddings
- Vector database basics
- Chunking
- Retrieval
- Content plagiarism avoidance
- Script structure for short videos

Important note:

RAG/vector database is usually not model training. It is a memory/retrieval layer that lets
the AI use your documents, references, and examples at generation time.

## Phase v4: Better Video Engine / Animated Explanation Layer

Goal:

The output should not feel like a plain talking-head video. It should explain using visuals.

Build:

- Scene-by-scene visual plan
- Captions with highlighted keywords
- Icons
- Diagrams
- Code blocks
- Background motion
- Transitions
- B-roll suggestions
- Music/sound options
- Multiple visual styles
- Preview-before-final-render flow

AI/ML learning topics:

- Storyboard generation
- Scene composition
- Video timeline concepts
- Motion graphics basics
- Multimodal prompting
- Image/video generation API basics
- Render pipeline design

Full-stack/media learning topics:

- Timeline data model
- Asset orchestration
- FFmpeg filter chains
- Render previews
- Video export settings

## Phase v5: Product UX, Status, and Project History

Goal:

Make PersonaForge feel smooth for repeated real use.

Build:

- Improved dashboard for generated videos
- Project history page
- Status timeline UI using `video_job_steps`
- Retry failed step from checkpoint
- Cancel queued/running jobs
- SSE or WebSocket status updates
- Better error messages in UI
- Download/share final video from UI
- Cleanup old temp files

AI/ML learning topics:

- Human-in-the-loop generation
- Evaluation of AI output quality
- Retry strategies for flaky AI providers

Full-stack learning topics:

- SSE vs WebSockets
- Job state machines
- Retry/cancel flows
- User-facing error design

## Phase v6: Voice Clone

Goal:

Generate voiceover in the creator's own voice.

Start API-based first. Later investigate custom/exportable voice models.

Build:

- Voice profile storage
- Voice sample upload
- Voice cloning provider integration
- Preview voice generation
- Audio cleanup
- Voice consent/safety flow
- Cost tracking per voice generation

AI/ML learning topics:

- TTS
- Voice cloning
- Speaker embeddings
- Audio sampling rate
- Noise reduction
- Phonemes
- Prosody
- Pitch, speed, emotion
- Inference vs training
- Voice model safety and consent

Training/local-model direction:

- First use provider APIs.
- Later test tools where voice models/weights can be exported.
- Prefer reusable voice profiles over regenerating/training repeatedly.

## Phase v7: Face Avatar and Lip Sync

Goal:

Generated voice should match the creator's face movement.

Start face-only before full body.

Build:

- Face avatar profile
- Input image/video validation
- Audio-to-face/lip-sync pipeline
- Facial expression options
- Head movement options
- Avatar quality checks
- Provider replacement interface

AI/ML learning topics:

- Computer vision basics
- Face detection
- Facial landmarks
- Lip-sync models
- Audio-to-mouth movement
- Frames and FPS
- Video encoding basics
- Inference pipeline
- Consent and identity safety

## Phase v8: Full Body Digital Clone / Gesture Engine

Goal:

Generate a video that looks like the creator recorded it, including body posture and hand
gestures.

Build:

- Body posture/gesture profile
- Training data checklist for creator videos
- Standing/sitting modes
- Gesture intensity controls
- Camera angle preference
- Combine body + face + voice
- Export realistic talking video
- Quality review/approval workflow

AI/ML learning topics:

- Pose estimation
- Body keypoints
- Gesture synthesis
- Motion transfer
- Diffusion models basics
- Avatar animation
- Temporal consistency
- Dataset preparation for personal motion
- Model evaluation

One-time vs every-video input:

One-time creator setup:

- Face
- Voice
- Body posture
- Hand gestures
- Speaking style
- Background preference
- Brand style

Every-video input:

- Topic
- Prompt
- Notes
- Reference video/article
- News/trending idea
- Duration
- Target audience

Retrain only when quality is weak or your look/style changes.

## Phase v9: Storage, Deployment, Cost, and Accounts

Goal:

Make the system production-ready and cost-safe.

Build:

- S3/R2 permanent storage
- Signed/private file URLs if needed
- Storage abstraction layer
- Production environment config
- Docker/deployment documentation
- Named Cloudflare Tunnel or deployed backend URL
- Background cleanup policies
- Authentication
- User-owned projects
- Usage tracking
- Detailed cost dashboard
- Per-user/project limits
- API credit guardrails
- Payments/subscription foundation
- Admin view for failed/expensive jobs

Learning topics:

- Object storage
- Public vs signed URLs
- Deployment environments
- Production secrets
- Multi-tenant data modeling
- Billing safety
- Cost estimation
- Rate limiting

## Phase v10: Brand, Templates, Variations, and Automation

Goal:

Turn PersonaForge from a generator into a creator workflow system.

Build:

- Brand profiles
- Color/font/logo settings
- Video templates
- Intro/outro templates
- Caption style presets
- Reusable prompt templates
- Template preview UI
- Multiple generated video versions
- A/B testing variants
- Viral hooks/title variations
- Auto publishing/export workflows
- Analytics foundation

AI/ML learning topics:

- Prompt templating
- Controlled generation
- Style consistency
- Ranking generated outputs
- Engagement prediction basics
- Automated workflow design

## Phase v11: Provider Replacement and Local AI Ownership

Goal:

Reduce dependency on paid third-party APIs where it makes sense.

Build:

- Provider comparison matrix
- Open-source model experiments
- Local inference experiments
- Exportable model workflow
- Cloud GPU training experiments
- Model registry/checkpoint storage
- Cost comparison: API vs self-hosted
- Fallback from local model to API provider

AI/ML learning topics:

- Fine-tuning
- LoRA/adapters
- Model checkpoints
- Inference optimization
- GPU memory basics
- Quantization basics
- Model serving
- Dataset licensing

Important:

Not every part needs custom training. Train only where it gives ownership, quality, or cost
benefit.

## Current Rule

Do not pull later-phase features into Phase v2 unless they directly support reliability or the
Creator Style Profile MVP.

Phase v2 should stay small:

```text
reliable generation + saved creator defaults
```
