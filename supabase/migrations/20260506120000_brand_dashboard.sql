-- supabase/migrations/20260506120000_brand_dashboard.sql

-- ── brand_campaigns ──────────────────────────────────────────────────────────
create table if not exists public.brand_campaigns (
  id               uuid        primary key default gen_random_uuid(),
  brand_id         uuid        not null references public.brand_profiles(id) on delete cascade,
  campaign_name    text        not null,
  brand_name       text,
  campaign_goal    text,
  product_name     text,
  product_category text,
  target_audience  text,
  city             text,
  region           text,
  start_date       date,
  end_date         date,
  payout_model     text,
  target_volume    int,
  tracking_link    text,
  notes            text,
  status           text        not null default 'pending',
  total_sellers    int         not null default 0,
  total_conversions int        not null default 0,
  total_leads      int         not null default 0,
  tracking_code    text        unique default 'c-' || substr(gen_random_uuid()::text, 1, 8),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── recruitment_requests ─────────────────────────────────────────────────────
create table if not exists public.recruitment_requests (
  id                   uuid        primary key default gen_random_uuid(),
  brand_id             uuid        not null references public.brand_profiles(id) on delete cascade,
  contact_person       text,
  hiring_timeline      text,
  location             text,
  industry             text,
  job_title            text        not null,
  num_hires            int,
  role_type            text,
  experience_level     text,
  industry_preference  text,
  responsibilities     text,
  required_skills      text[],
  salary_min           int,
  salary_max           int,
  work_type            text,
  job_location         text,
  deadline             date,
  additional_notes     text,
  status               text        not null default 'open',
  applicant_count      int         not null default 0,
  shortlist_count      int         not null default 0,
  assigned_support     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── activation_requests ──────────────────────────────────────────────────────
create table if not exists public.activation_requests (
  id                   uuid        primary key default gen_random_uuid(),
  brand_id             uuid        not null references public.brand_profiles(id) on delete cascade,
  company_name         text,
  contact_person       text,
  email                text,
  phone                text,
  activation_type      text,
  location             text,
  preferred_start_date date,
  preferred_end_date   date,
  goals                text,
  approximate_scale    text,
  notes                text,
  booking_type         text        not null default 'form',
  meeting_slot         text,
  status               text        not null default 'pending',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── updated_at triggers ──────────────────────────────────────────────────────
create trigger update_brand_campaigns_updated_at
  before update on public.brand_campaigns
  for each row execute function public.update_updated_at_column();

create trigger update_recruitment_requests_updated_at
  before update on public.recruitment_requests
  for each row execute function public.update_updated_at_column();

create trigger update_activation_requests_updated_at
  before update on public.activation_requests
  for each row execute function public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.brand_campaigns       enable row level security;
alter table public.recruitment_requests  enable row level security;
alter table public.activation_requests   enable row level security;

-- brand_campaigns
create policy "brands_select_own_campaigns"
  on public.brand_campaigns for select
  using (auth.uid() = brand_id);

create policy "brands_insert_own_campaigns"
  on public.brand_campaigns for insert
  with check (auth.uid() = brand_id);

create policy "admins_all_campaigns"
  on public.brand_campaigns for all
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- recruitment_requests
create policy "brands_select_own_recruitment"
  on public.recruitment_requests for select
  using (auth.uid() = brand_id);

create policy "brands_insert_own_recruitment"
  on public.recruitment_requests for insert
  with check (auth.uid() = brand_id);

create policy "admins_all_recruitment"
  on public.recruitment_requests for all
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- activation_requests
create policy "brands_select_own_activations"
  on public.activation_requests for select
  using (auth.uid() = brand_id);

create policy "brands_insert_own_activations"
  on public.activation_requests for insert
  with check (auth.uid() = brand_id);

create policy "admins_all_activations"
  on public.activation_requests for all
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
