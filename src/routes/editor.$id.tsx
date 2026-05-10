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
import { AIAssistant } from "@/components/AIAssistant";
import { templatesFor } from "@/lib/templates";

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
  stickers: Sticker[]; frame_style: string | null; max_guests: number | null;
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
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="ai">✨ IA</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
          <TabsTrigger value="stickers">Stickers</TabsTrigger>
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

            {/* PREVIEW (live) */}
            <div className="glass rounded-3xl p-4 lg:sticky lg:top-4 lg:self-start">
              <p className="mb-3 px-2 text-xs uppercase tracking-wider text-muted-foreground">Pré-visualização ao vivo</p>
              <InvitePreview
                type={inv.type}
                title={inv.title}
                host_names={inv.host_names}
                event_date={inv.event_date}
                location={inv.location}
                message={inv.message}
                cover_image_url={inv.cover_image_url}
                video_url={inv.video_url}
                background_music_url={inv.background_music_url}
                theme={inv.theme}
                font_family={inv.font_family}
                accent_color={inv.accent_color}
                frame_style={inv.frame_style}
                stickers={inv.stickers}
                onStickerMove={moveSticker}
                compact
              />
            </div>
          </div>
        </TabsContent>

        {/* IA — assistente */}
        <TabsContent value="ai" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <AIAssistant
              type={inv.type}
              title={inv.title}
              message={inv.message}
              onApply={(patch: Partial<Invite>) => {
                setInv((p) => p ? { ...p, ...patch } : p);
                save(patch);
              }}
            />
            <div className="glass rounded-3xl p-4 lg:sticky lg:top-4 lg:self-start">
              <InvitePreview
                type={inv.type} title={inv.title} host_names={inv.host_names}
                event_date={inv.event_date} location={inv.location} message={inv.message}
                cover_image_url={inv.cover_image_url} video_url={inv.video_url}
                background_music_url={inv.background_music_url}
                theme={inv.theme} font_family={inv.font_family}
                accent_color={inv.accent_color} frame_style={inv.frame_style}
                stickers={inv.stickers} compact
              />
            </div>
          </div>
        </TabsContent>

        {/* TEMPLATES PREMIUM */}
        <TabsContent value="templates" className="mt-4">
          <div className="glass space-y-4 rounded-3xl p-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Templates prontos</h3>
              <p className="text-sm text-muted-foreground">Aplique um layout completo com tema, fonte, moldura, cor e stickers.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templatesFor(inv.type).length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">Nenhum template para este tipo ainda.</p>
              )}
              {templatesFor(inv.type).map((tpl) => {
                const themeP = THEMES.find(t => t.id === tpl.theme) ?? THEMES[0];
                return (
                  <div key={tpl.id} className="overflow-hidden rounded-2xl border border-white/10">
                    <div
                      className="relative h-40 p-4"
                      style={{ background: themeP.gradient }}
                    >
                      {tpl.premium && (
                        <span className="absolute right-2 top-2 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-black">
                          ★ PREMIUM
                        </span>
                      )}
                      {tpl.stickers?.map((s) => (
                        <span key={s.id} className="absolute select-none"
                          style={{ left:`${s.x}%`, top:`${s.y}%`, fontSize:`${s.size*0.6}px`, transform:"translate(-50%,-50%)" }}>
                          {s.emoji}
                        </span>
                      ))}
                      <div className="absolute inset-x-0 bottom-2 text-center text-white">
                        <p className="text-[10px] uppercase tracking-widest opacity-80">{tpl.label}</p>
                      </div>
                    </div>
                    <div className="space-y-2 p-3">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-primary text-primary-foreground"
                        onClick={() => {
                          const patch = {
                            theme: tpl.theme, font_family: tpl.font_family,
                            accent_color: tpl.accent_color, frame_style: tpl.frame_style,
                            stickers: tpl.stickers ?? [],
                            ...(tpl.message && !inv.message ? { message: tpl.message } : {}),
                          };
                          setInv((p) => p ? { ...p, ...patch } : p);
                          save(patch);
                        }}
                      >
                        Aplicar template
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>


        <TabsContent value="visual" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="glass space-y-6 rounded-3xl p-6">
              <div>
                <Label className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Tema pronto</Label>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { update("theme", t.id); update("accent_color", t.accent); }}
                      className={`group relative h-20 overflow-hidden rounded-xl border-2 transition ${inv.theme === t.id ? "border-primary shadow-glow" : "border-white/10 hover:border-white/30"}`}
                      style={{ background: t.gradient }}
                    >
                      <span className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-[11px] text-white">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 flex items-center gap-2"><Type className="h-4 w-4 text-primary" /> Fonte personalizada</Label>
                <Select value={inv.font_family ?? "display"} onValueChange={(v) => update("font_family", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-3 block">Cor de destaque</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={inv.accent_color ?? "#22d3ee"}
                    onChange={(e) => update("accent_color", e.target.value)}
                    className="h-12 w-20 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <Input
                    value={inv.accent_color ?? ""}
                    onChange={(e) => update("accent_color", e.target.value)}
                    placeholder="#22d3ee"
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Moldura</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => update("frame_style", f.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${(inv.frame_style ?? "none") === f.id ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => save()} disabled={saving} className="bg-gradient-primary text-primary-foreground">
                <Save className="mr-1 h-4 w-4" /> Salvar visual
              </Button>
            </div>

            <div className="glass rounded-3xl p-4 lg:sticky lg:top-4 lg:self-start">
              <InvitePreview
                type={inv.type} title={inv.title} host_names={inv.host_names}
                event_date={inv.event_date} location={inv.location} message={inv.message}
                cover_image_url={inv.cover_image_url} video_url={inv.video_url}
                background_music_url={inv.background_music_url}
                theme={inv.theme} font_family={inv.font_family}
                accent_color={inv.accent_color} frame_style={inv.frame_style}
                stickers={inv.stickers} onStickerMove={moveSticker} compact
              />
            </div>
          </div>
        </TabsContent>

        {/* MÍDIA — uploads, vídeo, música */}
        <TabsContent value="media" className="mt-4">
          <div className="glass space-y-6 rounded-3xl p-6">
            <div>
              <Label className="mb-2 flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /> Imagem de capa</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload("cover_image_url", e.target.files[0])}
                  />
                  <span className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    <Upload className="h-4 w-4" /> Enviar imagem
                  </span>
                </label>
                <Input
                  value={inv.cover_image_url ?? ""}
                  onChange={(e) => update("cover_image_url", e.target.value)}
                  placeholder="ou cole uma URL https://…"
                  className="flex-1 min-w-[240px]"
                />
              </div>
              {inv.cover_image_url && (
                <img src={inv.cover_image_url} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />
              )}
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2"><Video className="h-4 w-4 text-primary" /> Vídeo (YouTube ou MP4)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload("video_url", e.target.files[0])}
                  />
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm">
                    <Upload className="h-4 w-4" /> Enviar vídeo
                  </span>
                </label>
                <Input
                  value={inv.video_url ?? ""}
                  onChange={(e) => update("video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=… ou .mp4"
                  className="flex-1 min-w-[240px]"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2"><Music className="h-4 w-4 text-primary" /> Música de fundo (MP3)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload("background_music_url", e.target.files[0])}
                  />
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm">
                    <Upload className="h-4 w-4" /> Enviar música
                  </span>
                </label>
                <Input
                  value={inv.background_music_url ?? ""}
                  onChange={(e) => update("background_music_url", e.target.value)}
                  placeholder="URL .mp3"
                  className="flex-1 min-w-[240px]"
                />
              </div>
              {inv.background_music_url && (
                <audio src={inv.background_music_url} controls className="mt-3 w-full" />
              )}
            </div>

            <Button onClick={() => save()} disabled={saving} className="bg-gradient-primary text-primary-foreground">
              <Save className="mr-1 h-4 w-4" /> Salvar mídia
            </Button>
          </div>
        </TabsContent>

        {/* STICKERS / EMOJIS / ELEMENTOS */}
        <TabsContent value="stickers" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass space-y-4 rounded-3xl p-6">
              <Label className="flex items-center gap-2"><Smile className="h-4 w-4 text-primary" /> Adicionar elemento</Label>
              <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
                {STICKERS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addSticker(emoji)}
                    className="rounded-lg bg-white/5 p-2 text-2xl transition hover:scale-110 hover:bg-white/15"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Arraste os stickers diretamente sobre a pré-visualização para reposicionar.</p>
              {(inv.stickers ?? []).length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <Label className="text-xs">Itens no convite ({inv.stickers.length})</Label>
                  {inv.stickers.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                      <span className="text-2xl">{s.emoji}</span>
                      <input
                        type="range" min={20} max={120} value={s.size}
                        onChange={(e) => resizeSticker(s.id, Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-10 text-xs text-muted-foreground">{s.size}px</span>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeSticker(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => save()} disabled={saving} className="bg-gradient-primary text-primary-foreground">
                <Save className="mr-1 h-4 w-4" /> Salvar stickers
              </Button>
            </div>

            <div className="glass rounded-3xl p-4 lg:sticky lg:top-4 lg:self-start">
              <InvitePreview
                type={inv.type} title={inv.title} host_names={inv.host_names}
                event_date={inv.event_date} location={inv.location} message={inv.message}
                cover_image_url={inv.cover_image_url} video_url={inv.video_url}
                background_music_url={inv.background_music_url}
                theme={inv.theme} font_family={inv.font_family}
                accent_color={inv.accent_color} frame_style={inv.frame_style}
                stickers={inv.stickers} onStickerMove={moveSticker} compact
              />
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
            <div className="space-y-1.5">
              <Label htmlFor="max_guests">Limite total de convidados (opcional)</Label>
              <Input
                id="max_guests"
                type="number"
                min={1}
                defaultValue={inv.max_guests ?? ""}
                onBlur={(e) => save({ max_guests: e.target.value ? Number(e.target.value) : null })}
                placeholder="Ex.: 120"
              />
              <p className="text-xs text-muted-foreground">As confirmações param automaticamente ao atingir o limite.</p>
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
          <div className="glass rounded-3xl p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 font-display text-xl font-semibold">Painel completo de presenças</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Veja confirmados, pendentes, gráficos e exporte para PDF/Excel.
            </p>
            <Button asChild className="mt-5 bg-gradient-primary text-primary-foreground shadow-glow">
              <Link to="/painel/$id" params={{ id: inv.id }}>Abrir painel ({rsvps.length})</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
