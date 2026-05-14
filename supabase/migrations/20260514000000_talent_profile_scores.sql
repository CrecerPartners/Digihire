create table if not exists talent_profile_scores (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles(id) on delete cascade,
  overall_score int not null default 0,
  experience_score int not null default 0,
  skills_score int not null default 0,
  completeness_score int not null default 0,
  education_score int not null default 0,
  availability_score int not null default 0,
  summary text,
  strengths text[] default '{}',
  suggested_roles text[] default '{}',
  ai_tags text[] default '{}',
  scored_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(talent_id)
);

alter table talent_profile_scores enable row level security;

-- Admin can do everything
create policy "admin full access on talent_profile_scores"
  on talent_profile_scores for all
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (
        auth.users.raw_user_meta_data->>'account_type' = 'admin'
        or auth.users.raw_user_meta_data->'account_types' ? 'admin'
      )
    )
  );
