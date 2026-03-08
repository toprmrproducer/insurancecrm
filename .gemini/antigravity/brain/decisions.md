# Decisions

Date: 2026-03-08

- Signup no longer sends confirmation emails. Accounts are created with the admin API and signed in immediately.
- Forgot-password remains Supabase-native email reset.
- Live pages show real empty states instead of seeded demo content when production data is empty.
- Placeholder controls that had no route or handler are being removed or replaced with wired actions.
- Operational priority order is:
  1. real calling path
  2. real data import/campaign execution
  3. UI alignment/polish
- `.env.example` must never contain real credentials.
