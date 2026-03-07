create extension if not exists "pgcrypto";

create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete restrict,
  full_name text,
  role text not null default 'agent' check (role in ('admin', 'agent', 'manager')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists sip_configurations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  label text not null,
  vobiz_trunk_id text,
  vobiz_sip_domain text not null,
  vobiz_username text not null,
  vobiz_password text not null,
  livekit_outbound_trunk_id text,
  livekit_inbound_trunk_id text,
  phone_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  first_name text not null,
  last_name text,
  phone text not null,
  email text,
  age integer,
  city text,
  state text,
  zip text,
  beneficiary text,
  monthly_premium numeric,
  monthly_premium_spoken text,
  draft_date date,
  draft_date_spoken text,
  transfer_number text,
  campaign_type text not null check (campaign_type in ('appointment_setter', 'renewal_reminder')),
  status text not null default 'new' check (
    status in (
      'new',
      'called',
      'callback_scheduled',
      'appointment_booked',
      'not_interested',
      'dnc',
      'transferred',
      'ineligible'
    )
  ),
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  do_not_call_before timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists leads_agency_phone_key on leads (agency_id, phone);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  sip_config_id uuid references sip_configurations(id) on delete set null,
  livekit_room_name text,
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  status text not null default 'initiated' check (
    status in (
      'initiated',
      'ringing',
      'in_progress',
      'completed',
      'failed',
      'no_answer',
      'voicemail'
    )
  ),
  campaign_type text check (campaign_type in ('appointment_setter', 'renewal_reminder')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  retry_count integer not null default 0,
  retry_of uuid references calls(id) on delete set null,
  recording_url text,
  transcript text,
  analysis_retries integer not null default 0,
  analysis_status text not null default 'pending' check (
    analysis_status in ('pending', 'processing', 'done', 'failed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists calls_lead_created_idx on calls (lead_id, created_at desc);
create index if not exists calls_agency_status_idx on calls (agency_id, status);

create table if not exists call_analysis (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references calls(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  outcome text,
  appointment_time text,
  comfort_with_premium boolean,
  comfort_monthly boolean,
  wants_more_coverage boolean,
  recommended_action text,
  summary text,
  should_continue_calling boolean,
  raw_analysis jsonb,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  call_id uuid references calls(id) on delete set null,
  agency_id uuid not null references agencies(id) on delete cascade,
  scheduled_for timestamptz not null,
  timezone text not null default 'America/Chicago',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  agent_notes text,
  created_at timestamptz not null default now()
);

alter table agencies enable row level security;
alter table profiles enable row level security;
alter table sip_configurations enable row level security;
alter table leads enable row level security;
alter table calls enable row level security;
alter table call_analysis enable row level security;
alter table appointments enable row level security;

create policy "agency members read agencies"
on agencies
for select
using (
  id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
);

create policy "users read own profile"
on profiles
for select
using (id = auth.uid());

create policy "users update own profile"
on profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "agency members manage leads"
on leads
for all
using (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
)
with check (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
);

create policy "agency members manage calls"
on calls
for all
using (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
)
with check (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
);

create policy "agency members manage call analysis"
on call_analysis
for all
using (
  lead_id in (
    select id
    from leads
    where agency_id = (
      select agency_id
      from profiles
      where profiles.id = auth.uid()
    )
  )
)
with check (
  lead_id in (
    select id
    from leads
    where agency_id = (
      select agency_id
      from profiles
      where profiles.id = auth.uid()
    )
  )
);

create policy "agency members manage appointments"
on appointments
for all
using (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
)
with check (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
);

create policy "admins manage sip configs"
on sip_configurations
for all
using (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
  and exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  agency_id = (
    select agency_id
    from profiles
    where profiles.id = auth.uid()
  )
  and exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

