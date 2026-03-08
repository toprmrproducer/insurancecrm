# Integrations

Date: 2026-03-08

## Supabase
- Auth for signup, login, logout, password reset
- Postgres with agency-scoped RLS
- Edge Function `analyze-call`

## LiveKit
- SIP inbound/outbound trunks
- Room creation
- Agent dispatch
- SIP participant dialing

## Vobiz
- SIP domain, username, password, DID
- Stored through CRM SIP settings flow

## Gemini / Google AI
- Realtime audio in Python worker
- Flash text analysis in Edge Function

## Current dependency chain for outbound call
- Saved active SIP config
- LiveKit API credentials
- Running Python agent worker
- LiveKit dispatch rule / agent registration
- Valid lead row with callable status
