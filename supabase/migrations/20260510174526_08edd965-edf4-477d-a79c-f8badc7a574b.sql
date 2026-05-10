
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Invite type enum
CREATE TYPE public.invite_type AS ENUM (
  'casamento','aniversario','cha_bebe','cha_revelacao','amigo_secreto',
  'formatura','corporativo','infantil','religioso'
);

-- Invites
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  type public.invite_type NOT NULL,
  title TEXT NOT NULL,
  host_names TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  location_url TEXT,
  description TEXT,
  message TEXT,
  theme TEXT NOT NULL DEFAULT 'nebula',
  cover_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  rsvp_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invites_user ON public.invites(user_id);
CREATE INDEX idx_invites_slug ON public.invites(slug);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Owners full access
CREATE POLICY "Owners view their invites" ON public.invites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners create invites" ON public.invites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their invites" ON public.invites FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete their invites" ON public.invites FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Public can view published invites
CREATE POLICY "Anyone views published invites" ON public.invites FOR SELECT TO anon, authenticated USING (published = true);

-- RSVPs
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  attending BOOLEAN NOT NULL DEFAULT true,
  guest_count INT NOT NULL DEFAULT 1,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rsvps_invite ON public.rsvps(invite_id);
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can RSVP to a published invite
CREATE POLICY "Anyone can rsvp to published invites" ON public.rsvps FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.published = true AND i.rsvp_enabled = true));
-- Only invite owner can view rsvps
CREATE POLICY "Owner views rsvps" ON public.rsvps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.user_id = auth.uid()));
CREATE POLICY "Owner deletes rsvps" ON public.rsvps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invites i WHERE i.id = invite_id AND i.user_id = auth.uid()));

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_invites_updated BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
