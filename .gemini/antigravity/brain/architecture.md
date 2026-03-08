# Architecture

Date: 2026-03-08

## System shape
- `apps/web`: Next.js App Router CRM UI and route handlers
- `services/agent`: LiveKit worker that connects SIP calls to Gemini audio
- `supabase`: Postgres schema and Edge Function for post-call analysis

## Runtime flow
1. User signs in with Supabase Auth.
2. CRM UI uses authenticated server-side Supabase access for agency-scoped data.
3. Lead import writes CSV data into `leads`.
4. SIP setup stores Vobiz credentials and provisions matching LiveKit trunks.
5. Call initiation creates a `calls` row, LiveKit room, agent dispatch, and SIP participant.
6. Python worker joins the room, runs Gemini voice logic, and updates transcript/outcome data.
7. Supabase Edge Function analyzes completed calls and writes `call_analysis`.

## Current frontend posture
- Dashboard, leads, calls, appointments, campaigns, analytics, and profile now read live Supabase data.
- Operational actions are exposed in the UI for lead import, call-now, campaign run, SIP config, signup, login, password reset, and logout.
- Non-implemented actions were removed instead of left as dead controls.
