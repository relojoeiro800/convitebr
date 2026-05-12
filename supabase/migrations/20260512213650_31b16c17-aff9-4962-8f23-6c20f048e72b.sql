
-- 1) Remover sistema antigo de planos
DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_profile_subscription() CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TYPE IF EXISTS public.plan_tier CASCADE;

-- 2) Tabela de créditos por usuário
CREATE TABLE public.credits (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits" ON public.credits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage credits" ON public.credits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Histórico de transações
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,           -- positivo = crédito, negativo = débito
  reason text NOT NULL,              -- ex: 'admin_grant','publish_invite','refund'
  invite_id uuid,
  actor_id uuid,                     -- quem executou (admin ou o próprio usuário)
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX credit_tx_user_idx ON public.credit_transactions(user_id, created_at DESC);

CREATE POLICY "Users view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert transactions" ON public.credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Função admin para ajustar saldo
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_user_id uuid, _delta integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.credits (user_id, balance)
    VALUES (_user_id, GREATEST(0, _delta))
    ON CONFLICT (user_id) DO UPDATE
      SET balance = GREATEST(0, public.credits.balance + _delta),
          updated_at = now()
    RETURNING balance INTO new_balance;
  INSERT INTO public.credit_transactions(user_id, amount, reason, actor_id)
    VALUES (_user_id, _delta, COALESCE(_reason, 'admin_adjust'), auth.uid());
  RETURN new_balance;
END $$;

-- 5) Consumir 1 crédito ao publicar
CREATE OR REPLACE FUNCTION public.consume_credit_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE current_balance integer;
BEGIN
  IF NEW.published = true AND (OLD.published IS DISTINCT FROM true) THEN
    SELECT balance INTO current_balance FROM public.credits WHERE user_id = NEW.user_id FOR UPDATE;
    IF current_balance IS NULL OR current_balance < 1 THEN
      RAISE EXCEPTION 'Você não tem créditos suficientes para publicar. Entre em contato com o administrador.';
    END IF;
    UPDATE public.credits SET balance = balance - 1, updated_at = now() WHERE user_id = NEW.user_id;
    INSERT INTO public.credit_transactions(user_id, amount, reason, invite_id, actor_id)
      VALUES (NEW.user_id, -1, 'publish_invite', NEW.id, auth.uid());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER invites_consume_credit
  BEFORE UPDATE OF published ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.consume_credit_on_publish();

CREATE TRIGGER invites_consume_credit_insert
  BEFORE INSERT ON public.invites
  FOR EACH ROW
  WHEN (NEW.published = true)
  EXECUTE FUNCTION public.consume_credit_on_publish();

-- 6) Atualizar admin stats: remover dependência de planos (já não referenciava diretamente, mas garantindo)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_invites', (SELECT count(*) FROM public.invites),
    'published_invites', (SELECT count(*) FROM public.invites WHERE published = true),
    'total_rsvps', (SELECT count(*) FROM public.rsvps),
    'monthly_revenue_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.payments
        WHERE status='paid' AND created_at >= date_trunc('month', now())),
    'total_revenue_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.payments WHERE status='paid'),
    'pending_templates', (SELECT count(*) FROM public.admin_templates WHERE status='pending'),
    'suspended_users', (SELECT count(*) FROM public.suspended_accounts),
    'total_credits_issued', (SELECT COALESCE(SUM(balance),0) FROM public.credits),
    'top_invites', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT id, title, slug, view_count FROM public.invites
        WHERE published = true ORDER BY view_count DESC LIMIT 10
      ) t
    ),
    'recent_users', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT id, full_name, created_at FROM public.profiles
        ORDER BY created_at DESC LIMIT 10
      ) t
    ),
    'revenue_by_day', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               SUM(amount_cents) AS amount_cents
        FROM public.payments
        WHERE status='paid' AND created_at >= now() - interval '30 days'
        GROUP BY 1 ORDER BY 1
      ) t
    )
  ) INTO result;
  RETURN result;
END $$;
