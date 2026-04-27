-- Storage RLS policies for the `equipment-photos` bucket.
--
-- Prerequisite: create the bucket first via Supabase Dashboard → Storage →
-- New bucket → name: `equipment-photos`, Public bucket: ON. Then run this SQL.
-- Idempotent: safe to re-run.

-- Public read so the calculator (anon) can fetch images by URL
DROP POLICY IF EXISTS "Public read equipment photos" ON storage.objects;
CREATE POLICY "Public read equipment photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'equipment-photos');

-- Authenticated upload / overwrite / delete (admin panel writes)
DROP POLICY IF EXISTS "Auth upload equipment photos" ON storage.objects;
CREATE POLICY "Auth upload equipment photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'equipment-photos');

DROP POLICY IF EXISTS "Auth update equipment photos" ON storage.objects;
CREATE POLICY "Auth update equipment photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'equipment-photos')
  WITH CHECK (bucket_id = 'equipment-photos');

DROP POLICY IF EXISTS "Auth delete equipment photos" ON storage.objects;
CREATE POLICY "Auth delete equipment photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'equipment-photos');
