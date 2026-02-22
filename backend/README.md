# EventMatrix Backend

Minimal Express + MongoDB backend for EventMatrix.

Setup

1. Copy `.env.example` to `.env` and configure `MONGO_URI`.
2. From `backend` folder run:

```powershell
npm install
npm run dev
```

API

- `GET /api/events` - list events
- `POST /api/events` - create event (JSON body: `title`, `description`, `date`)
