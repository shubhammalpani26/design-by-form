-- Admins can read customer-uploaded source photos for quality review and issue analysis.
-- originals-uploads stays private for everyone else; no anon/authenticated access added.
create policy "Admins can view originals uploads"
on storage.objects
for select
to authenticated
using (bucket_id = 'originals-uploads' and public.has_role(auth.uid(), 'admin'));