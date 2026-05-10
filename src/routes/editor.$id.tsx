import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Users, Globe, Gift, Trash2, Shuffle, Copy, Upload, ImagePlus, Smile, Palette, Type, Music, Video } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVITE_TYPES, type InviteType } from "@/lib/invites";
import { THEMES, FONTS, FRAMES, STICKERS, type Sticker } from "@/lib/editor-presets";
import { InvitePreview } from "@/components/InvitePreview";
import { uploadInviteMedia } from "@/lib/upload";

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
  font_family: string | null; accent_color: string | null;
  background_music_url: string | null; video_url: string | null;
  stickers: Sticker[]; frame_style: string | null;
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  async function loadParticipants() {
    const { data } = await supabase
      .from("secret_santa_participants")
      .select("id,name,email,phone,reveal_token,assigned_to_id")
      .eq("invite_id", id)
      .order("created_at", { ascending: true });
    setParticipants((data ?? []) as Participant[]);
  }

  useEffect(() => {
    if (!user) return;
    supabase.from("invites").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error) { toast.error(error.message); navigate({ to: "/dashboard" }); return; }
      const d = data as Record<string, unknown>;
      setInv({ ...(d as object), stickers: Array.isArray(d.stickers) ? (d.stickers as Sticker[]) : [] } as Invite);
    });
    supabase.from("rsvps").select("*").eq("invite_id", id).order("created_at", { ascending: false }).then(({ data }) => {
      setRsvps((data ?? []) as Rsvp[]);
    });
    loadParticipants();
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
        gift_list_url: payload.gift_list_url, dress_code: payload.dress_code,
        couple_story: payload.couple_story, playlist_url: payload.playlist_url,
        baby_name: payload.baby_name, baby_theme: payload.baby_theme,
        font_family: payload.font_family, accent_color: payload.accent_color,
        background_music_url: payload.background_music_url, video_url: payload.video_url,
        stickers: JSON.parse(JSON.stringify(payload.stickers ?? [])), frame_style: payload.frame_style,
      })
      .eq("id", inv.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Salvo!"); if (extra) setInv((p) => (p ? { ...p, ...extra } : p)); }
  }

  async function handleUpload(field: "cover_image_url" | "background_music_url" | "video_url", file: File) {
    if (!user || !inv) return;
    try {
      toast.loading("Enviando arquivo…", { id: "up" });
      const url = await uploadInviteMedia(file, user.id, inv.id);
      update(field, url);
      toast.success("Arquivo enviado!", { id: "up" });
    } catch (e) {
      toast.error((e as Error).message, { id: "up" });
    }
  }

  function addSticker(emoji: string) {
    const s: Sticker = {
      id: Math.random().toString(36).slice(2, 9),
      emoji, x: 50, y: 50, size: 40,
    };
    update("stickers", [...(inv?.stickers ?? []), s]);
  }
  function moveSticker(sid: string, x: number, y: number) {
    update("stickers", (inv?.stickers ?? []).map((s) => s.id === sid ? { ...s, x, y } : s));
  }
  function removeSticker(sid: string) {
    update("stickers", (inv?.stickers ?? []).filter((s) => s.id !== sid));
  }
  function resizeSticker(sid: string, size: number) {
    update("stickers", (inv?.stickers ?? []).map((s) => s.id === sid ? { ...s, size } : s));
  }

  async function addParticipant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inv) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim().slice(0, 80);
    const email = String(fd.get("email") || "").trim().slice(0, 120) || null;
    const phone = String(fd.get("phone") || "").trim().slice(0, 30) || null;
    if (!name) return toast.error("Informe o nome");
    const { error } = await supabase
      .from("secret_santa_participants")
      .insert({ invite_id: inv.id, name, email, phone });
    if (error) return toast.error(error.message);
    (e.currentTarget as HTMLFormElement).reset();
    loadParticipants();
  }

  async function removeParticipant(pid: string) {
    if (!confirm("Remover este participante?")) return;
    await supabase.from("secret_santa_participants").delete().eq("id", pid);
    loadParticipants();
  }

  async function runDraw() {
    if (!inv) return;
    if (!confirm("Realizar o sorteio? Isso substituirá qualquer sorteio anterior.")) return;
    setDrawing(true);
    const { error } = await supabase.rpc("draw_secret_santa", { _invite_id: inv.id });
    setDrawing(false);
    if (error) return toast.error(error.message);
    toast.success("Sorteio realizado! Compartilhe os links de revelação.");
    loadParticipants();
  }

  function copyRevealLink(token: string) {
    const url = `${window.location.origin}/sorteio/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/convite/${inv.slug}`;
  const isSecretSanta = inv.type === "amigo_secreto";
  const isWedding = inv.type === "casamento";
  const isBaby = inv.type === "cha_bebe" || inv.type === "cha_revelacao";

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
          <TabsTrigger value="extras">Extras</TabsTrigger>
          {isSecretSanta && <TabsTrigger value="santa">Amigo Secreto</TabsTrigger>}
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

        {/* EXTRAS — campos por tipo */}
        <TabsContent value="extras" className="mt-4">
          <div className="glass space-y-4 rounded-3xl p-6">
            <div className="space-y-1.5">
              <Label>Lista de presentes (URL)</Label>
              <Input
                value={inv.gift_list_url ?? ""}
                onChange={(e) => update("gift_list_url", e.target.value)}
                placeholder="https://lista.com/…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Playlist (URL Spotify, YouTube…)</Label>
              <Input
                value={inv.playlist_url ?? ""}
                onChange={(e) => update("playlist_url", e.target.value)}
                placeholder="https://open.spotify.com/…"
              />
            </div>
            {isWedding && (
              <>
                <div className="space-y-1.5">
                  <Label>Dress code</Label>
                  <Input
                    value={inv.dress_code ?? ""}
                    onChange={(e) => update("dress_code", e.target.value)}
                    placeholder="Ex.: Esporte fino, tons claros"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nossa história (casal)</Label>
                  <Textarea
                    value={inv.couple_story ?? ""}
                    onChange={(e) => update("couple_story", e.target.value)}
                    rows={5}
                    placeholder="Como tudo começou…"
                  />
                </div>
              </>
            )}
            {isBaby && (
              <>
                <div className="space-y-1.5">
                  <Label>Nome do bebê</Label>
                  <Input
                    value={inv.baby_name ?? ""}
                    onChange={(e) => update("baby_name", e.target.value)}
                    placeholder="Ex.: Helena"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tema (cores / decoração)</Label>
                  <Input
                    value={inv.baby_theme ?? ""}
                    onChange={(e) => update("baby_theme", e.target.value)}
                    placeholder="Ex.: Floresta encantada, tons rosa"
                  />
                </div>
              </>
            )}
            <Button
              onClick={() => save()}
              disabled={saving}
              className="bg-gradient-primary text-primary-foreground"
            >
              <Save className="mr-1 h-4 w-4" /> Salvar extras
            </Button>
          </div>
        </TabsContent>

        {/* AMIGO SECRETO */}
        {isSecretSanta && (
          <TabsContent value="santa" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div className="glass space-y-4 rounded-3xl p-6">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-xl font-semibold">Adicionar participante</h3>
                </div>
                <form onSubmit={addParticipant} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input name="name" required maxLength={80} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail (opcional)</Label>
                    <Input name="email" type="email" maxLength={120} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone (opcional)</Label>
                    <Input name="phone" maxLength={30} placeholder="+55 11 99999-9999" />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">
                    Adicionar
                  </Button>
                </form>
                <Button
                  onClick={runDraw}
                  disabled={drawing || participants.length < 2}
                  variant="outline"
                  className="w-full border-primary/30"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  {drawing ? "Sorteando…" : "Realizar sorteio"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Mínimo 2 participantes. O sorteio embaralha aleatoriamente.
                </p>
              </div>

              <div className="glass rounded-3xl p-6">
                <h3 className="mb-4 font-display text-xl font-semibold">
                  Participantes ({participants.length})
                </h3>
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum participante ainda.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {participants.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.email || p.phone || "—"}
                          </p>
                          {p.assigned_to_id && (
                            <p className="mt-1 text-xs text-primary">✓ sorteado</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/15 bg-white/5"
                            onClick={() => copyRevealLink(p.reveal_token)}
                            title="Copiar link de revelação"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => removeParticipant(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>
        )}

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
