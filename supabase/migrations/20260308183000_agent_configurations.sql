create table if not exists agent_configurations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  campaign_type text not null check (campaign_type in ('appointment_setter', 'renewal_reminder')),
  model text not null default 'gemini-2.5-flash-native-audio-preview-12-2025',
  voice text not null default 'Aoede',
  agent_name text not null default 'Mia',
  first_line text,
  prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, campaign_type)
);

alter table agent_configurations enable row level security;

create policy "admins manage agent configs"
on agent_configurations
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
