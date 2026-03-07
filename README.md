# Insurance CRM Starter

This repository is a scaffold for the insurance CRM stack described in the project blueprint:

- `apps/web`: Next.js 15 web app and route handlers
- `services/agent`: LiveKit + Gemini Python agent worker
- `supabase`: SQL migrations and Edge Functions

## What is already normalized in this scaffold

The starter bakes in a few corrections that were missing or unsafe in the original draft:

- outbound calling uses explicit LiveKit agent dispatch
- route handlers verify the signed-in user's agency before using the service role client
- lead import uses a real unique constraint on `(agency_id, phone)`
- call retry and analysis status are modeled in the schema
- appointment booking has a dedicated `appointments` table
- webhook analysis is idempotent and tracks retries

## Repo status

This is intentionally a starter, not a complete product. The files here establish the shape of the system and the critical backend flows. You still need to:

- install dependencies
- wire the full UI and design system
- finish LiveKit event handling for transcript and call-end reasons
- configure Supabase, LiveKit Cloud, Vobiz, Vercel, and Railway/Fly

## Suggested next steps

1. Install the web and Python dependencies.
2. For a UI-only preview, copy `.env.example`, keep `NEXT_PUBLIC_DEMO_MODE=true`, and deploy `apps/web`.
3. Run the Supabase migration in `supabase/migrations` when you are ready for live data.
4. Set the real environment variables from the blueprint and switch `NEXT_PUBLIC_DEMO_MODE=false`.
5. Deploy the Python worker and create the SIP dispatch rule.
6. Replace the demo pages with live queries and the final component system.
