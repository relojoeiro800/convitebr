
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Categories
CREATE TABLE public.template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views categories" ON public.template_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.template_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Templates
CREATE TABLE public.admin_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  category_id uuid REFERENCES public.template_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  theme text,
  preview_url text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  is_premium boolean NOT NULL DEFAULT false,
  price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views approved templates" ON public.admin_templates FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR public.has_role(auth.uid(),'admin') OR auth.uid() = created_by);
CREATE POLICY "Users submit templates" ON public.admin_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins manage templates" ON public.admin_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete templates" ON public.admin_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER admin_templates_updated_at BEFORE UPDATE ON public.admin_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invite_id uuid,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending', -- pending|paid|refunded|failed
  provider text,
  provider_id text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- System logs
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON public.system_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated insert logs" ON public.system_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id OR public.has_role(auth.uid(),'admin'));

-- Suspensions
CREATE TABLE public.suspended_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  reason text,
  suspended_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suspended_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suspensions" ON public.suspended_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users see own suspension" ON public.suspended_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
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
    'top_invites', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT id, title, slug, view_count
        FROM public.invites
        WHERE published = true
        ORDER BY view_count DESC LIMIT 10
      ) t
    ),
    'recent_users', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT id, full_name, created_at
        FROM public.profiles
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
