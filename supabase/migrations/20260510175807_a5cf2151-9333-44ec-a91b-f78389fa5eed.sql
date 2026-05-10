ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS gift_list_url text,
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS couple_story text,
  ADD COLUMN IF NOT EXISTS playlist_url text,
  ADD COLUMN IF NOT EXISTS baby_name text,
  ADD COLUMN IF NOT EXISTS baby_theme text;

CREATE TABLE IF NOT EXISTS public.secret_santa_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  assigned_to_id uuid REFERENCES public.secret_santa_participants(id) ON DELETE SET NULL,
  reveal_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ssp_invite ON public.secret_santa_participants(invite_id);

ALTER TABLE public.secret_santa_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views participants"
ON public.secret_santa_participants FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.user_id = auth.uid()));

CREATE POLICY "Owner inserts participants"
ON public.secret_santa_participants FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.user_id = auth.uid()));

CREATE POLICY "Owner updates participants"
ON public.secret_santa_participants FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.user_id = auth.uid()));

CREATE POLICY "Owner deletes participants"
ON public.secret_santa_participants FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.user_id = auth.uid()));

-- Owner-triggered shuffle and pairing
CREATE OR REPLACE FUNCTION public.draw_secret_santa(_invite_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ids uuid[];
  shuffled uuid[];
  n integer;
  i integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.invites WHERE id = _invite_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT array_agg(id ORDER BY random()) INTO ids
    FROM public.secret_santa_participants WHERE invite_id = _invite_id;

  n := COALESCE(array_length(ids, 1), 0);
  IF n < 2 THEN
    RAISE EXCEPTION 'precisa de pelo menos 2 participantes';
  END IF;

  shuffled := ids[2:n] || ids[1:1];

  FOR i IN 1..n LOOP
    UPDATE public.secret_santa_participants
       SET assigned_to_id = shuffled[i]
     WHERE id = ids[i];
  END LOOP;

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.draw_secret_santa(uuid) TO authenticated;

-- Reveal by private token
CREATE OR REPLACE FUNCTION public.get_secret_santa_assignment(_token text)
RETURNS TABLE(participant_name text, assigned_name text, invite_title text, event_date timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.name,
    a.name,
    i.title,
    i.event_date
  FROM public.secret_santa_participants p
  LEFT JOIN public.secret_santa_participants a ON a.id = p.assigned_to_id
  LEFT JOIN public.invites i ON i.id = p.invite_id
  WHERE p.reveal_token = _token;
$$;

GRANT EXECUTE ON FUNCTION public.get_secret_santa_assignment(text) TO anon, authenticated;