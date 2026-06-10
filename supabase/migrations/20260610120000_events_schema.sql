-- Events
create table if not exists events (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  event_type            text,
  location              text,
  event_date            timestamptz,
  end_date              timestamptz,
  capacity              int,
  registration_deadline timestamptz,
  status                text not null default 'upcoming' check (status in ('upcoming', 'live', 'past')),
  banner_url            text,
  gallery               jsonb not null default '[]',
  meeting_url           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Event Registrations
create table if not exists event_registrations (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events on delete cascade,
  talent_id       uuid not null references auth.users on delete cascade,
  full_name       text,
  email           text,
  status          text not null default 'registered',
  registered_at   timestamptz not null default now(),
  followup_notes  text,
  unique (event_id, talent_id)
);

-- updated_at trigger
create trigger update_events_updated_at
  before update on events
  for each row execute function public.update_updated_at_column();

-- Indexes
create index on events (status);
create index on events (event_date);
create index on event_registrations (event_id);
create index on event_registrations (talent_id);

-- RLS
alter table events enable row level security;
alter table event_registrations enable row level security;

-- events policies
create policy "events readable by authenticated"
  on events for select
  using (auth.role() = 'authenticated');

create policy "admin can manage events"
  on events for all
  using ((auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin');

-- event_registrations policies
create policy "talent can manage own registrations"
  on event_registrations for all
  using (auth.uid() = talent_id)
  with check (auth.uid() = talent_id);

create policy "admin can manage all registrations"
  on event_registrations for all
  using ((auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin');
