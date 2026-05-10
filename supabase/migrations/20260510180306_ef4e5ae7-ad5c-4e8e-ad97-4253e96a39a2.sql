
-- Add visual editor fields
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'display',
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS background_music_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS stickers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS frame_style text;

-- Storage bucket for invite media (images, audio, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invite-media', 'invite-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for invite media
CREATE POLICY "Public read invite media"
ON storage.objects FOR SELECT
USING (bucket_id = 'invite-media');

-- Authenticated users upload to their own folder (user_id/...)
CREATE POLICY "Users upload own invite media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invite-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own invite media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'invite-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own invite media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'invite-media' AND auth.uid()::text = (storage.foldername(name))[1]);
