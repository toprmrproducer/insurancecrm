# Known Issues

Date: 2026-03-08

- Real outbound calling still depends on external infrastructure being correctly configured:
  - LiveKit trunks
  - Vobiz credentials
  - running agent worker
  - dispatch rule
- Call transcript capture in the worker is still tool-note-heavy and not a full conversation capture yet.
- Analytics and dashboard visualizations are simplified; they read live data but are not yet chart-rich.
- Appointment status update actions are not implemented yet, so the UI shows status only.
- No dedicated E2E suite exists yet for signup, import, call initiation, and campaign launch.
