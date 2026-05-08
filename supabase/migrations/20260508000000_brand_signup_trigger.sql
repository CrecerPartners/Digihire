-- Trigger to auto-create brand_profiles and talent_profiles on user signup
-- Runs server-side (security definer), bypasses RLS entirely.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'account_type' = 'brand' then
    insert into public.brand_profiles (id, company_name, contact_name, phone)
    values (
      new.id,
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'phone'
    )
    on conflict (id) do nothing;

  elsif new.raw_user_meta_data->>'account_type' = 'talent' then
    insert into public.talent_profiles (id, full_name, phone, status, profile_completion)
    values (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'phone',
      'incomplete',
      0
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- Drop old trigger if it exists, then create the unified one
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
