import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Heart, Crown, Sparkles, ArrowLeft, Copy, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INVITE_TYPES, inviteTypeLabel, slugify, type InviteType } from "@/lib/invites";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
  head: () => ({
    meta: [
      { title: "Biblioteca de Templates — Convite BR" },
      { name: "description", content: "Explore templates premium organizados por categoria. Busque, favorite e duplique para criar seu convite em segundos." },
    ],
  }),
});

type Template = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  theme: string | null;
  preview_url: string | null;
  config: Record<string, unknown>;
  is_premium: boolean;
  price_cents: number;
  category_id: string | null;
};

type Category = { id: string; name: string; slug: string; icon: string | null };

function TemplatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<"all" | "favorites" | string>("all");
  const [activeType, setActiveType] = useState<"all" | InviteType>("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("admin_templates").select("*").eq("status", "approved")
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => setTemplates((data ?? []) as Template[]));
    supabase.from("template_categories").select("id,name,slug,icon").order("name")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  useEffect(() => {
    if (!user) { setFavorites(new Set()); return; }
    supabase.from("template_favorites").select("template_id").eq("user_id", user.id)
      .then(({ data }) => setFavorites(new Set((data ?? []).map((r: { template_id: string }) => r.template_id))));
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (activeCat === "favorites" && !favorites.has(t.id)) return false;
      if (activeCat !== "all" && activeCat !== "favorites" && t.category_id !== activeCat) return false;
      if (activeType !== "all" && t.type !== activeType) return false;
      if (term) {
        const hay = `${t.name} ${t.description ?? ""} ${t.theme ?? ""} ${t.type}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [templates, search, activeCat, activeType, favorites]);

  async function toggleFav(id: string) {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (favorites.has(id)) {
      await supabase.from("template_favorites").delete().eq("user_id", user.id).eq("template_id", id);
      setFavorites((p) => { const n = new Set(p); n.delete(id); return n; });
    } else {
      await supabase.from("template_favorites").insert({ user_id: user.id, template_id: id });
      setFavorites((p) => new Set(p).add(id));
    }
  }

  async function useTemplate(t: Template) {
    if (!user) { navigate({ to: "/auth" }); return; }
    setBusy(t.id);
    const cfg = (t.config ?? {}) as Record<string, unknown>;
    const title = `${t.name} — cópia`;
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("invites").insert({
      user_id: user.id,
      title,
      type: t.type as InviteType,
      slug,
      theme: t.theme ?? "nebula",
      cover_image_url: t.preview_url,
      ...cfg,
    }).select("id").single();
    setBusy(null);
    if (error || !data) return toast.error(error?.message || "Erro ao duplicar template");
    toast.success("Template duplicado!");
    navigate({ to: "/editor/$id", params: { id: data.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" asChild size="sm">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
          </Button>
          {user && (
            <Button variant="outline" asChild size="sm"><Link to="/dashboard">Meu painel</Link></Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="mb-3">Biblioteca de templates</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Comece com um template lindo
          </h1>
          <p className="mt-3 text-muted-foreground">
            Templates premium aprovados, organizados por categoria. Favorite os que ama e duplique em um clique.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, tema ou descrição…"
            className="pl-10"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")}>Todos</Chip>
          <Chip active={activeCat === "favorites"} onClick={() => setActiveCat("favorites")}>
            <Heart className="h-3 w-3 mr-1 inline" />Favoritos
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>

        {/* Type chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <Chip small active={activeType === "all"} onClick={() => setActiveType("all")}>Todos os tipos</Chip>
          {INVITE_TYPES.map((t) => (
            <Chip small key={t.value} active={activeType === t.value} onClick={() => setActiveType(t.value)}>
              <span className="mr-1">{t.emoji}</span>{t.label}
            </Chip>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles className="mx-auto h-10 w-10 mb-4 opacity-50" />
            <p>Nenhum template encontrado.</p>
            {activeCat === "favorites" && (
              <p className="text-sm mt-1">Adicione favoritos clicando no coração.</p>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <Card key={t.id} className="overflow-hidden flex flex-col group">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/15 to-secondary/15 overflow-hidden">
                  {t.preview_url ? (
                    <img
                      src={t.preview_url}
                      alt={t.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-5xl opacity-60">
                      {INVITE_TYPES.find((x) => x.value === t.type)?.emoji ?? "✨"}
                    </div>
                  )}
                  <button
                    onClick={() => toggleFav(t.id)}
                    aria-label="Favoritar"
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur grid place-items-center hover:bg-background transition"
                  >
                    <Heart
                      className={`h-4 w-4 ${favorites.has(t.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                    />
                  </button>
                  {t.is_premium && (
                    <Badge className="absolute top-3 left-3 bg-gradient-primary text-primary-foreground">
                      <Crown className="h-3 w-3 mr-1" />Premium
                    </Badge>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold leading-tight">{t.name}</h3>
                    <Badge variant="outline" className="shrink-0 text-xs">{inviteTypeLabel(t.type)}</Badge>
                  </div>
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
                  )}
                  <div className="mt-auto flex gap-2">
                    {t.preview_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={t.preview_url} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-primary text-primary-foreground"
                      disabled={busy === t.id}
                      onClick={() => useTemplate(t)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {busy === t.id ? "Duplicando…" : "Usar template"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Chip({
  active, onClick, children, small,
}: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border transition ${
        small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted text-foreground border-border"
      }`}
    >
      {children}
    </button>
  );
}
