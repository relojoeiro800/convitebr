
CREATE TABLE public.credit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0 AND amount <= 1000),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX credit_requests_user_idx ON public.credit_requests(user_id, created_at DESC);
CREATE INDEX credit_requests_status_idx ON public.credit_requests(status, created_at DESC);

CREATE POLICY "Users view own credit requests" ON public.credit_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own credit requests" ON public.credit_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins update credit requests" ON public.credit_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER credit_requests_updated_at
  BEFORE UPDATE ON public.credit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Aprovar uma solicitação: credita o usuário e marca como aprovada
CREATE OR REPLACE FUNCTION public.approve_credit_request(_request_id uuid, _note text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record; new_balance integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO r FROM public.credit_requests WHERE id = _request_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Solicitação já processada'; END IF;

  INSERT INTO public.credits (user_id, balance)
    VALUES (r.user_id, r.amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = public.credits.balance + r.amount, updated_at = now()
    RETURNING balance INTO new_balance;

  INSERT INTO public.credit_transactions(user_id, amount, reason, actor_id, metadata)
    VALUES (r.user_id, r.amount, 'request_approved', auth.uid(),
            jsonb_build_object('request_id', r.id));

  UPDATE public.credit_requests
     SET status = 'approved', admin_note = _note,
         reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = r.id;

  RETURN new_balance;
END $$;
