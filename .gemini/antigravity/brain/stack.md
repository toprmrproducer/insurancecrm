# Stack

Date: 2026-03-08

- Frontend: Next.js 15, React 19, TypeScript
- Auth/Data: Supabase Auth + Postgres + RLS
- Voice bridge: LiveKit Cloud SIP/Rooms/Agent Dispatch
- Telephony: Vobiz SIP trunks configured through CRM settings
- Voice model: Gemini realtime audio via LiveKit agent worker
- Backend worker: Python 3.12 + livekit-agents + Supabase Python client
- Post-call analysis: Supabase Edge Function + Gemini Flash
- Deployment: Docker / Coolify for web, separate worker container for agent

## Required env groups
- Public web auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server auth/admin: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- LiveKit: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- AI: `GOOGLE_API_KEY`, `GEMINI_API_KEY`
- Ops: `CRON_SECRET`
- Optional recordings: `SUPABASE_S3_ACCESS_KEY`, `SUPABASE_S3_SECRET`
