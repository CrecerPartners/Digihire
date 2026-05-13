insert into storage.buckets (id, name, public) values ('talent-assets', 'talent-assets', true) on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'talent-assets' );
create policy "Auth Insert" on storage.objects for insert with check ( bucket_id = 'talent-assets' and auth.role() = 'authenticated' );
create policy "Auth Update" on storage.objects for update using ( bucket_id = 'talent-assets' and auth.role() = 'authenticated' );
