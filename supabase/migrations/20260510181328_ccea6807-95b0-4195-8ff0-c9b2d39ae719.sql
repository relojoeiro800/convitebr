
DROP POLICY IF EXISTS "Anyone views own rsvp by token" ON public.rsvps;

CREATE OR REPLACE FUNCTION public.get_rsvp_by_token(_token text)
RETURNS TABLE(
  id uuid, invite_id uuid, guest_name text, attending boolean,
  guest_count integer, message text, notes text, created_at timestamptz,
  invite_title text, event_date timestamptz, slug text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.invite_id, r.guest_name, r.attending, r.guest_count,
         r.message, r.notes, r.created_at,
         i.title, i.event_date, i.slug
  FROM public.rsvps r
  JOIN public.invites i ON i.id = r.invite_id
  WHERE r.token = _token
  LIMIT 1;
$$;
