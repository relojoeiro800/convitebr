import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Users, Globe, Gift, Trash2, Shuffle, Copy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVITE_TYPES, type InviteType, formatEventDate } from "@/lib/invites";

export const Route = createFileRoute("/editor/$id")({
  component: Editor,
  head: () => ({ meta: [{ title: "Editor — Convite BR" }] }),
});

type Invite = {
  id: string; slug: string; user_id: string; type: InviteType;
  title: string; host_names: string | null; event_date: string | null;
  location: string | null; location_url: string | null; description: string | null;
  message: string | null; theme: string; cover_image_url: string | null;
  published: boolean; rsvp_enabled: boolean;
  gift_list_url: string | null; dress_code: string | null; couple_story: string | null;
  playlist_url: string | null; baby_name: string | null; baby_theme: string | null;
};

type Rsvp = { id: string; guest_name: string; attending: boolean; guest_count: number; message: string | null; created_at: string };

type Participant = {
  id: string; name: string; email: string | null; phone: string | null;
  reveal_token: string; assigned_to_id: string | null;
};

function Editor() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Invite | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("invites").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error) { toast.error(error.message); navigate({ to: "/dashboard" }); return; }
      setInv(data as Invite);
    });
    supabase.from("rsvps").select("*").eq("invite_id", id).order("created_at", { ascending: false }).then(({ data }) => {
      setRsvps((data ?? []) as Rsvp[]);
    });
  }, [user, id, navigate]);

  if (!inv) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  function update<K extends keyof Invite>(k: K, v: Invite[K]) {
    setInv((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function save(extra?: Partial<Invite>) {
    if (!inv) return;
    setSaving(true);
    const payload = { ...inv, ...extra };
    const { error } = await supabase
      .from("invites")
      .update({
        title: payload.title, type: payload.type, host_names: payload.host_names,
        event_date: payload.event_date, location: payload.location, location_url: payload.location_url,
        description: payload.description, message: payload.message, theme: payload.theme,
        cover_image_url: payload.cover_image_url, published: payload.published, rsvp_enabled: payload.rsvp_enabled,
      })
      .eq("id", inv.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Salvo!"); if (extra) setInv((p) => (p ? { ...p, ...extra } : p)); }
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/convite/${inv.slug}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Meus convites</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/5">
            <Link to="/convite/$slug" params={{ slug: inv.slug }} target="_blank">
              <Eye className="mr-1 h-4 w-4" /> Pré-visualizar
            </Link>
          </Button>
          <Button
            onClick={() => save({ published: !inv.published })}
            size="sm"
            className={inv.published ? "" : "bg-gradient-primary text-primary-foreground"}
            variant={inv.published ? "outline" : "default"}
          >
            <Globe className="mr-1 h-4 w-4" /> {inv.published ? "Despublicar" : "Publicar"}
          </Button>
          <Button onClick={() => save()} disabled={saving} size="sm" className="bg-gradient-primary text-primary-foreground">
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="bg-secondary">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="settings">Ajustes</TabsTrigger>
          <TabsTrigger value="rsvp">Confirmações ({rsvps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass space-y-4 rounded-3xl p-6">
              <div className="space-y-1.5">
                <Label>Tipo do evento</Label>
                <Select value={inv.type} onValueChange={(v) => update("type", v as InviteType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVITE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Título do convite</Label>
                <Input value={inv.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Anfitriões</Label>
                <Input value={inv.host_names ?? ""} onChange={(e) => update("host_names", e.target.value)} placeholder="Ex.: Ana & João" />
              </div>
              <div className="space-y-1.5">
                <Label>Data e hora</Label>
                <Input
                  type="datetime-local"
                  value={inv.event_date ? new Date(inv.event_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => update("event_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Local</Label>
                <Input value={inv.location ?? ""} onChange={(e) => update("location", e.target.value)} placeholder="Endereço ou nome do espaço" />
              </div>
              <div className="space-y-1.5">
                <Label>Link do mapa (opcional)</Label>
                <Input value={inv.location_url ?? ""} onChange={(e) => update("location_url", e.target.value)} placeholder="https://maps.google.com/…" />
              </div>
              <div className="space-y-1.5">
                <Label>Mensagem</Label>
                <Textarea
                  value={inv.message ?? ""}
                  onChange={(e) => update("message", e.target.value)}
                  rows={4}
                  placeholder="Uma palavra carinhosa para seus convidados…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL da imagem de capa (opcional)</Label>
                <Input value={inv.cover_image_url ?? ""} onChange={(e) => update("cover_image_url", e.target.value)} placeholder="https://…" />
              </div>
            </div>

            {/* PREVIEW */}
            <div className="glass rounded-3xl p-6">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Pré-visualização</p>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-nebula p-8 text-center stars">
                {inv.cover_image_url ? (
                  <img src={inv.cover_image_url} alt="" className="mx-auto mb-4 h-40 w-full rounded-xl object-cover" />
                ) : null}
                <p className="text-xs uppercase tracking-[0.3em] text-primary">
                  {INVITE_TYPES.find((t) => t.value === inv.type)?.label}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold">{inv.title || "Seu título aqui"}</h2>
                {inv.host_names && <p className="mt-1 text-sm text-muted-foreground">{inv.host_names}</p>}
                {inv.event_date && <p className="mt-4 text-sm">{formatEventDate(inv.event_date)}</p>}
                {inv.location && <p className="mt-1 text-sm text-muted-foreground">{inv.location}</p>}
                {inv.message && <p className="mx-auto mt-6 max-w-sm text-sm italic text-muted-foreground">“{inv.message}”</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="glass space-y-5 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Convite publicado</Label>
                <p className="text-xs text-muted-foreground">Permite acesso pelo link público</p>
              </div>
              <Switch checked={inv.published} onCheckedChange={(v) => save({ published: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Aceitar confirmações (RSVP)</Label>
                <p className="text-xs text-muted-foreground">Convidados podem confirmar presença</p>
              </div>
              <Switch checked={inv.rsvp_enabled} onCheckedChange={(v) => save({ rsvp_enabled: v })} />
            </div>
            {inv.published && (
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Link público</p>
                <p className="mt-1 break-all font-mono text-sm">{publicUrl}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Copiado!"); }}
                >
                  Copiar link
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rsvp" className="mt-4">
          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-semibold">Convidados que responderam</h3>
            </div>
            {rsvps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma resposta ainda.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {rsvps.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{r.guest_name}</p>
                      {r.message && <p className="mt-0.5 text-xs text-muted-foreground">“{r.message}”</p>}
                    </div>
                    <div className="text-right text-xs">
                      <p className={r.attending ? "text-primary" : "text-destructive"}>
                        {r.attending ? `Vai (${r.guest_count})` : "Não vai"}
                      </p>
                      <p className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
