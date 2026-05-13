-- talent_webinars table
create table if not exists public.talent_webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  host_name text,
  host_title text,
  host_photo_url text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  meeting_url text,
  cover_color text default '#0ea5e9',
  category text default 'General',
  max_registrations int,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- talent_webinar_registrations table
create table if not exists public.talent_webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.talent_webinars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique(webinar_id, user_id)
);

-- RLS
alter table public.talent_webinars enable row level security;
alter table public.talent_webinar_registrations enable row level security;

create policy "Public can view published webinars"
  on public.talent_webinars for select
  using (is_published = true);

create policy "Admins can manage webinars"
  on public.talent_webinars for all
  using (auth.role() = 'authenticated');

create policy "Users can manage own registrations"
  on public.talent_webinar_registrations for all
  using (auth.uid() = user_id);

create policy "Users can view all registrations for a webinar"
  on public.talent_webinar_registrations for select
  using (true);
