# Conventions

Date: 2026-03-08

- Server components fetch agency-scoped data with authenticated Supabase helpers.
- Route handlers return explicit JSON errors with actionable messages.
- Demo mode is allowed only as a fallback when auth env is missing; production paths must not silently show fake data once auth is live.
- UI controls should either execute a real workflow or be removed. No decorative dead buttons.
- Sensitive keys belong only in runtime env, never in tracked example files.
- App shell should show real workspace/user context and avoid fake search/notification chrome unless implemented.
