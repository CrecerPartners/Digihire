-- =============================================================================
-- Multi-role user signup trigger
-- =============================================================================
-- Role model:
--   voltsquad  → VoltSquad sales rep / seller (created in public.profiles)
--   talent     → Job-seeking talent (created in public.talent_profiles)
--               A talent can ALSO be a voltsquad member.
--   brand      → Company/hiring manager (created in public.brand_profiles)
--   admin      → Full access (managed separately via user_roles table)
--
-- Rules:
--   - Regular users: may hold [brand] OR [talent] OR [talent, voltsquad]
--   - Admin users: assigned separately; can access any app
--   - account_types is stored as a JSONB array in raw_user_meta_data
--   - Legacy: single string in account_type is also supported
-- =============================================================================

-- Drop the old single-role trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_brand_user();
drop function if exists public.handle_new_user();

-- Create the unified multi-role handler
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _types  jsonb;
  _type   text;
begin
  -- Resolve account_types: prefer the array, fall back to single string
  if new.raw_user_meta_data ? 'account_types' then
    _types := new.raw_user_meta_data -> 'account_types';
  elsif new.raw_user_meta_data ? 'account_type' then
    -- Wrap legacy single string into a JSON array
    _types := jsonb_build_array(new.raw_user_meta_data ->> 'account_type');
  else
    _types := '[]'::jsonb;
  end if;

  -- Create a brand_profile if the user registered as a brand
  if _types ? 'brand' then
    insert into public.brand_profiles (id, company_name, contact_name, phone)
    values (
      new.id,
      new.raw_user_meta_data ->> 'company_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'phone'
    )
    on conflict (id) do nothing;
  end if;

  -- Create a talent_profile if the user registered as talent OR voltsquad
  -- (voltsquad members are a subset of talent)
  if (_types ? 'talent') or (_types ? 'voltsquad') then
    insert into public.talent_profiles (id, full_name, phone, status, profile_completion)
    values (
      new.id,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'phone',
      'incomplete',
      0
    )
    on conflict (id) do nothing;
  end if;

  -- Admin role is never assigned at signup — handled separately via user_roles table

  return new;
end;
$$;

-- Attach the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_signup();

-- =============================================================================
-- Helper: check if a user holds a non-system role (brand / talent / voltsquad)
-- NOTE: Admin/moderator/user roles are managed by the app_role enum in
--       user_roles and checked via the existing public.has_role() RPC.
--       This helper is only for the product-level roles stored in metadata.
-- =============================================================================
create or replace function public.user_has_product_role(_user_id uuid, _role text)
returns boolean
language sql
stable security definer set search_path = public
as $$
  select
    coalesce(
      (raw_user_meta_data -> 'account_types') ? _role,
      (raw_user_meta_data ->> 'account_type') = _role,
      false
    )
  from auth.users
  where id = _user_id;
$$;
