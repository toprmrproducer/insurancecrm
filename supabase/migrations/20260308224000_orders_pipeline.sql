create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  title text not null,
  amount numeric,
  status text not null default 'new' check (status in ('new', 'processing', 'completed', 'cancelled', 'refunded')),
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_agency_created_idx on orders (agency_id, created_at desc);

alter table orders enable row level security;

create policy "agency members manage orders"
on orders
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
