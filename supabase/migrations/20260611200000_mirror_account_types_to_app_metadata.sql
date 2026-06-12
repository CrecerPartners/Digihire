-- =============================================================================
-- Mirror product roles into app_metadata (fixes brand portal lockout)
-- =============================================================================
-- Commit 9ef1353 changed the brands Login to require 'brand' in
-- app_metadata.account_types (user_metadata is client-editable via
-- auth.updateUser(), so it must not be trusted for role checks).
-- But nothing ever wrote account_types into raw_app_meta_data, so EVERY brand
-- account failed the check and was locked out.
--
-- This migration makes app_metadata the real source of truth:
--   1. A BEFORE INSERT trigger mirrors the signup-chosen roles into
--      raw_app_meta_data, sanitized to the open-registration roles only.
--      app_metadata can only be changed server-side afterwards, so users
--      cannot self-escalate post-signup.
--   2. A backfill applies the same mirror to all existing users.
--
-- SECURITY: 'admin' is deliberately excluded from the mirror. Several RLS
-- policies trust app_metadata for admin checks; copying user-supplied
-- metadata verbatim would let anyone sign up as admin. Admin access stays
-- managed exclusively via public.user_roles. We also never write the legacy
-- 'account_type' string key, which some RLS policies compare to 'admin'.
-- =============================================================================

create or replace function public.mirror_account_types_to_app_metadata()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _claimed jsonb;
  _safe    jsonb;
begin
  if new.raw_user_meta_data ? 'account_types'
     and jsonb_typeof(new.raw_user_meta_data -> 'account_types') = 'array' then
    _claimed := new.raw_user_meta_data -> 'account_types';
  elsif new.raw_user_meta_data ? 'account_type' then
    _claimed := jsonb_build_array(new.raw_user_meta_data ->> 'account_type');
  else
    _claimed := '[]'::jsonb;
  end if;

  -- Open-registration roles only — never 'admin' (see header).
  select coalesce(jsonb_agg(distinct t.value), '[]'::jsonb)
    into _safe
    from jsonb_array_elements_text(_claimed) as t(value)
   where t.value in ('brand', 'talent', 'voltsquad');

  new.raw_app_meta_data := jsonb_set(
    coalesce(new.raw_app_meta_data, '{}'::jsonb),
    '{account_types}',
    _safe
  );

  return new;
end;
$$;

drop trigger if exists before_auth_user_created_mirror_roles on auth.users;
create trigger before_auth_user_created_mirror_roles
  before insert on auth.users
  for each row execute procedure public.mirror_account_types_to_app_metadata();

-- ── Backfill existing users ─────────────────────────────────────────────────
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{account_types}',
  coalesce(
    (
      select jsonb_agg(distinct t.value)
        from jsonb_array_elements_text(
          case
            when raw_user_meta_data ? 'account_types'
                 and jsonb_typeof(raw_user_meta_data -> 'account_types') = 'array'
              then raw_user_meta_data -> 'account_types'
            when raw_user_meta_data ? 'account_type'
              then jsonb_build_array(raw_user_meta_data ->> 'account_type')
            else '[]'::jsonb
          end
        ) as t(value)
       where t.value in ('brand', 'talent', 'voltsquad')
    ),
    '[]'::jsonb
  )
)
where raw_user_meta_data ? 'account_types'
   or raw_user_meta_data ? 'account_type';
