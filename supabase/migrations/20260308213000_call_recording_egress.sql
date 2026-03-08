alter table calls add column if not exists livekit_egress_id text;
alter table calls add column if not exists recording_status text default 'not_started';
alter table calls add column if not exists recording_error text;
alter table calls add column if not exists recording_bucket_path text;

create index if not exists calls_livekit_egress_id_idx on calls (livekit_egress_id);
