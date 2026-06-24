# PersonaForge Frontend

React dashboard for the PersonaForge Phase 1 backend.

## Stack

- React + Vite
- Tailwind CSS
- Axios
- Sonner notifications
- Lucide icons

## Setup

```bash
cd Frontend
npm install
cp .env.example .env
```

Update `.env` if your backend port changes:

```env
VITE_API_BASE_URL=http://localhost:6001
VITE_BULL_BOARD_URL=http://localhost:6001/admin/queues
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Backend

Run the backend API and worker separately:

```bash
cd ../Backend
npm run dev
npm run worker
```

The frontend calls:

- `POST /api/videos/generate`
- `GET /api/jobs/:jobId`
- `GET /api/videos/:projectId`
- `GET /health`

All API calls go through:

```text
src/api/axiosInstance.js
```
