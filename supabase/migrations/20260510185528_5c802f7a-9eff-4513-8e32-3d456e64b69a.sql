
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  invite_id uuid REFERENCES public.invites(id) ON DELETE CASCADE,
  rsvp_id uuid REFERENCES public.rsvps(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'email',
  trigger text NOT NULL,
  recipient text NOT NULL,
  subject text,
  body text,
  status text NOT NULL DEFAULT 'pending',
  provider_id text,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_invite ON public.notifications(invite_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their notifications"
ON public.notifications FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.invites i WHERE i.id = notifications.invite_id AND i.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins manage notifications"
ON public.notifications FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.invites i WHERE i.id = notifications.invite_id AND i.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Plans catalog
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  interval text NOT NULL DEFAULT 'month',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_invites integer,
  max_guests_per_invite integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active plans"
ON public.plans FOR SELECT TO anon, authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage plans"
ON public.plans FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default plans
INSERT INTO public.plans (slug, name, description, price_cents, features, max_invites, max_guests_per_invite, sort_order) VALUES
  ('free', 'Grátis', 'Para começar a criar convites digitais', 0, '["1 convite ativo", "Até 30 convidados", "RSVP básico"]'::jsonb, 1, 30, 1),
  ('pro', 'Pro', 'Para quem quer impressionar', 2990, '["Convites ilimitados", "Até 300 convidados por evento", "Notificações por email", "Relatórios avançados"]'::jsonb, NULL, 300, 2),
  ('premium', 'Premium', 'Experiência completa para grandes eventos', 5990, '["Tudo do Pro", "Convidados ilimitados", "Domínio personalizado", "Suporte prioritário"]'::jsonb, NULL, NULL, 3);
