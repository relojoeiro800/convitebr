
CREATE TABLE public.template_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.admin_templates(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id)
);
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites" ON public.template_favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add favorites" ON public.template_favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove favorites" ON public.template_favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.template_categories (name, slug, description, icon) VALUES
  ('Casamento','casamento','Convites românticos e elegantes','heart'),
  ('Aniversário','aniversario','Festas adultas e infantis','cake'),
  ('Chá de bebê','cha-de-bebe','Chá revelação e chás clássicos','baby'),
  ('Amigo secreto','amigo-secreto','Sorteios de fim de ano','gift'),
  ('Corporativo','corporativo','Eventos profissionais','briefcase'),
  ('Outros','outros','Demais ocasiões','sparkles')
ON CONFLICT (slug) DO NOTHING;
