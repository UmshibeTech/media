create table if not exists public.booking_enquiries (
  id uuid primary key default gen_random_uuid(),
  client_name text not null
    check (char_length(btrim(client_name)) between 1 and 120),
  client_phone text not null
    check (char_length(btrim(client_phone)) between 1 and 40),
  event_type text not null
    check (event_type in (
      'Traditional Wedding',
      'White Wedding',
      'Umemulo',
      'Umembeso',
      'Umkhehlo',
      'Graduation',
      'Party or Special Event',
      'Digital Invitation',
      'Other'
    )),
  event_date date not null,
  event_location text not null
    check (char_length(btrim(event_location)) between 1 and 200),
  message text not null default ''
    check (char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.booking_enquiries enable row level security;

drop policy if exists "Anyone can submit a booking enquiry"
  on public.booking_enquiries;
create policy "Anyone can submit a booking enquiry"
  on public.booking_enquiries
  for insert
  to anon
  with check (true);

revoke all on table public.booking_enquiries from anon, authenticated;
grant usage on schema public to anon;
grant insert (
  client_name,
  client_phone,
  event_type,
  event_date,
  event_location,
  message
) on table public.booking_enquiries to anon;

create table if not exists public.whatsapp_quote_notification_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_quote_notification_attempts_ip_created_idx
  on public.whatsapp_quote_notification_attempts (ip_hash, created_at);
create index if not exists whatsapp_quote_notification_attempts_created_idx
  on public.whatsapp_quote_notification_attempts (created_at);

alter table public.whatsapp_quote_notification_attempts enable row level security;
revoke all on table public.whatsapp_quote_notification_attempts from anon, authenticated;
grant all on table public.whatsapp_quote_notification_attempts to service_role;
grant usage, select on sequence public.whatsapp_quote_notification_attempts_id_seq to service_role;
