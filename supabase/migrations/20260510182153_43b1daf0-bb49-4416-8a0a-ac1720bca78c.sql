
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_by uuid;

CREATE OR REPLACE FUNCTION public.check_in_rsvp(_token text)
RETURNS TABLE(
  id uuid, guest_name text, attending boolean, guest_count integer,
  checked_in_at timestamptz, already boolean, invite_title text, invite_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  inv record;
  was_already boolean := false;
BEGIN
  SELECT * INTO r FROM public.rsvps WHERE token = _token;
  IF r IS NULL THEN
    RAISE EXCEPTION 'Convidado não encontrado';
  END IF;
  SELECT i.user_id, i.title, i.id AS iid INTO inv
    FROM public.invites i WHERE i.id = r.invite_id;
  IF inv.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Apenas o organizador pode fazer check-in';
  END IF;
  IF r.attending = false THEN
    RAISE EXCEPTION 'Este convidado recusou o convite';
  END IF;
  IF r.checked_in_at IS NOT NULL THEN
    was_already := true;
  ELSE
    UPDATE public.rsvps
       SET checked_in_at = now(), checked_in_by = auth.uid()
     WHERE id = r.id
     RETURNING checked_in_at INTO r.checked_in_at;
  END IF;
  RETURN QUERY SELECT r.id, r.guest_name, r.attending, r.guest_count,
                      r.checked_in_at, was_already, inv.title, inv.iid;
END $$;
