
-- Add guest restriction + RSVP enhancements
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS max_guests integer;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(12), 'hex');
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS phone text;
CREATE UNIQUE INDEX IF NOT EXISTS rsvps_token_unique ON public.rsvps(token);
CREATE INDEX IF NOT EXISTS rsvps_invite_idx ON public.rsvps(invite_id);

-- Allow public to view single rsvp by token (for QR confirmation page)
DROP POLICY IF EXISTS "Anyone views own rsvp by token" ON public.rsvps;
CREATE POLICY "Anyone views own rsvp by token"
ON public.rsvps FOR SELECT
TO anon, authenticated
USING (true);

-- Realtime for organizer panel
ALTER TABLE public.rsvps REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rsvps'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps';
  END IF;
END $$;

-- Enforce max_guests limit on insert
CREATE OR REPLACE FUNCTION public.enforce_rsvp_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  total integer;
BEGIN
  SELECT max_guests, rsvp_enabled, published INTO inv
    FROM public.invites WHERE id = NEW.invite_id;
  IF inv IS NULL OR inv.published = false OR inv.rsvp_enabled = false THEN
    RAISE EXCEPTION 'rsvp not allowed';
  END IF;
  IF NEW.guest_count IS NULL OR NEW.guest_count < 1 THEN
    NEW.guest_count := 1;
  END IF;
  IF inv.max_guests IS NOT NULL AND NEW.attending = true THEN
    SELECT COALESCE(SUM(guest_count),0) INTO total
      FROM public.rsvps WHERE invite_id = NEW.invite_id AND attending = true;
    IF total + NEW.guest_count > inv.max_guests THEN
      RAISE EXCEPTION 'Limite de convidados (%) atingido', inv.max_guests;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rsvp_limits_trigger ON public.rsvps;
CREATE TRIGGER rsvp_limits_trigger
BEFORE INSERT ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.enforce_rsvp_limits();
