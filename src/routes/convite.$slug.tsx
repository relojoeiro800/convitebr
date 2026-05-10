import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Calendar, MapPin, Heart, Send, ExternalLink, Gift, Music as MusicIcon, Shirt, Baby, BookOpen, QrCode as QrIcon, Volume2, VolumeX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Countdown } from "@/components/Countdown";
import { QRCode } from "@/components/QRCode";
import { VideoEmbed } from "@/components/InvitePreview";
import { fontCss, themePreset, FRAMES, type Sticker } from "@/lib/editor-presets";
import { INVITE_TYPES, formatEventDate, type InviteType } from "@/lib/invites";

export const Route = createFileRoute("/convite/$slug")({
  component: PublicInvite,
});

type Invite = {
  id: string; slug: string; type: InviteType; title: string;
  host_names: string | null; event_date: string | null; location: string | null;
  location_url: string | null; description: string | null; message: string | null;
  cover_image_url: string | null; rsvp_enabled: boolean;
  gift_list_url: string | null; dress_code: string | null; couple_story: string | null;
  playlist_url: string | null; baby_name: string | null; baby_theme: string | null;
  theme: string; font_family: string | null; accent_color: string | null;
  background_music_url: string | null; video_url: string | null;
  stickers: Sticker[]; frame_style: string | null;
};

function PublicInvite() {
  const { slug } = Route.useParams();
  const [inv, setInv] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    supabase
      .from("invites")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as Record<string, unknown> | null;
        const parsed = d ? ({ ...(d as object), stickers: Array.isArray(d.stickers) ? (d.stickers as Sticker[]) : [] } as Invite) : null;
        setInv(parsed);
        setLoading(false);
        if (parsed?.title) document.title = `${parsed.title} — Convite BR`;
        if (parsed?.id) {
          supabase.rpc("increment_invite_view", { _slug: slug });
        }
      });
  }, [slug]);

  function toggleMusic() {
    const a = audioRef.current;
    if (!a) return;
    if (musicOn) { a.pause(); setMusicOn(false); }
    else { a.play().then(() => setMusicOn(true)).catch(() => toast.error("Não foi possível reproduzir")); }
  }

  async function handleRsvp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inv) return;
    const fd = new FormData(e.currentTarget);
    const guest_name = String(fd.get("name") || "").trim().slice(0, 80);
    const attending = fd.get("attending") === "yes";
    const guest_count = Math.max(1, Math.min(20, Number(fd.get("guest_count") || 1)));
    const message = String(fd.get("message") || "").trim().slice(0, 500) || null;
    if (!guest_name) return toast.error("Informe seu nome");
    setSubmitting(true);
    const { error } = await supabase.from("rsvps").insert({
      invite_id: inv.id, guest_name, attending, guest_count, message,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setSubmitted(true);
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  if (!inv) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Convite não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O link pode ter expirado ou estar incorreto.</p>
      </main>
    );
  }

  const typeMeta = INVITE_TYPES.find((t) => t.value === inv.type);
  const theme = themePreset(inv.theme);
  const accent = inv.accent_color || theme.accent;
  const frame = FRAMES.find((f) => f.id === (inv.frame_style ?? "none")) ?? FRAMES[0];

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-12" style={{ fontFamily: fontCss(inv.font_family) }}>
      <div className="stars absolute inset-0 -z-10" />
      {inv.background_music_url && (
        <>
          <audio ref={audioRef} src={inv.background_music_url} loop preload="auto" />
          <button
            onClick={toggleMusic}
            className="fixed right-4 top-4 z-50 rounded-full bg-card/80 p-3 shadow-elegant backdrop-blur transition hover:scale-110"
            aria-label="Música de fundo"
          >
            {musicOn ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </>
      )}
      <article className={`relative overflow-hidden rounded-[2rem] shadow-elegant ${frame.css ?? ""}`} style={{ background: theme.gradient }}>
        {/* COVER */}
        <div className="relative h-56 overflow-hidden sm:h-72">
          {inv.cover_image_url ? (
            <img src={inv.cover_image_url} alt={inv.title} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: theme.gradient, opacity: 0.9 }} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="relative px-6 pb-10 pt-6 text-center text-white sm:px-12">
          {/* Stickers overlay */}
          {(inv.stickers ?? []).map((s) => (
            <span key={s.id} className="pointer-events-none absolute select-none"
              style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: `${s.size}px`, transform: "translate(-50%,-50%)" }}>
              {s.emoji}
            </span>
          ))}
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: accent }}>{typeMeta?.label}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{inv.title}</h1>
          {inv.host_names && <p className="mt-2 text-base opacity-80">{inv.host_names}</p>}

          {inv.message && (
            <p className="mx-auto mt-8 max-w-md text-xl italic opacity-95">
              "{inv.message}"
            </p>
          )}

          {inv.video_url && (
            <div className="mx-auto mt-8 max-w-md">
              <VideoEmbed url={inv.video_url} />
            </div>
          )}

          <div className="mx-auto mt-10 grid max-w-md gap-3 text-left">
            {inv.event_date && (
              <div className="glass flex items-start gap-3 rounded-2xl p-4">
                <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Quando</p>
                  <p className="text-sm font-medium">{formatEventDate(inv.event_date)}</p>
                </div>
              </div>
            )}
            {inv.location && (
              <div className="glass flex items-start gap-3 rounded-2xl p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Onde</p>
                  <p className="text-sm font-medium">{inv.location}</p>
                  {inv.location_url && (
                    <a href={inv.location_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Abrir mapa <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {inv.description && (
            <p className="mx-auto mt-8 max-w-md text-sm text-muted-foreground">{inv.description}</p>
          )}

          {/* COUNTDOWN */}
          {inv.event_date && (
            <div className="mx-auto mt-10 max-w-md">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Contagem regressiva
              </p>
              <Countdown date={inv.event_date} />
            </div>
          )}

          {/* CASAMENTO: história do casal */}
          {inv.couple_story && (inv.type === "casamento") && (
            <div className="mx-auto mt-10 max-w-md text-left">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" /> Nossa história
              </div>
              <p className="glass rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-line">
                {inv.couple_story}
              </p>
            </div>
          )}

          {/* CHÁ DE BEBÊ / REVELAÇÃO */}
          {inv.baby_name && (inv.type === "cha_bebe" || inv.type === "cha_revelacao") && (
            <div className="mx-auto mt-10 max-w-md">
              <div className="glass rounded-2xl p-6 text-center">
                <Baby className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Vamos receber
                </p>
                <p className="mt-1 font-display text-3xl font-semibold text-gradient">
                  {inv.baby_name}
                </p>
                {inv.baby_theme && (
                  <p className="mt-2 text-xs text-muted-foreground">Tema: {inv.baby_theme}</p>
                )}
              </div>
            </div>
          )}

          {/* LISTA DE PRESENTES */}
          {inv.gift_list_url && (
            <div className="mx-auto mt-8 max-w-md">
              <a
                href={inv.gift_list_url}
                target="_blank"
                rel="noreferrer"
                className="glass flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-glow"
              >
                <Gift className="h-5 w-5 text-primary" />
                <div className="flex-1 text-left">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Lista de presentes
                  </p>
                  <p className="text-sm font-medium">Ver e escolher</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          )}

          {/* DRESS CODE */}
          {inv.dress_code && (
            <div className="mx-auto mt-4 max-w-md">
              <div className="glass flex items-center gap-3 rounded-2xl p-4 text-left">
                <Shirt className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Dress code
                  </p>
                  <p className="text-sm font-medium">{inv.dress_code}</p>
                </div>
              </div>
            </div>
          )}

          {/* PLAYLIST */}
          {inv.playlist_url && (
            <div className="mx-auto mt-4 max-w-md">
              <a
                href={inv.playlist_url}
                target="_blank"
                rel="noreferrer"
                className="glass flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-glow"
              >
                <Music className="h-5 w-5 text-primary" />
                <div className="flex-1 text-left">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Playlist do evento
                  </p>
                  <p className="text-sm font-medium">Ouvir agora</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          )}

          {/* QR CODE para acesso rápido */}
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <QrIcon className="h-4 w-4 text-primary" /> Acesso rápido
            </div>
            <QRCode value={typeof window !== "undefined" ? window.location.href : ""} size={160} />
          </div>


          {/* RSVP */}
          {inv.rsvp_enabled && (
            <div className="mt-12 border-t border-white/10 pt-8 text-left">
              <h2 className="text-center font-display text-2xl font-semibold">Confirme sua presença</h2>
              {submitted ? (
                <div className="mt-6 glass rounded-2xl p-6 text-center">
                  <Heart className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-3 font-display text-xl">Obrigado!</p>
                  <p className="mt-1 text-sm text-muted-foreground">Sua resposta foi registrada.</p>
                </div>
              ) : (
                <form onSubmit={handleRsvp} className="mx-auto mt-6 max-w-md space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Seu nome</Label>
                    <Input id="name" name="name" required maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label>Você vai comparecer?</Label>
                    <RadioGroup name="attending" defaultValue="yes" className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Sim, com prazer</label>
                      <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> Não poderei</label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guest_count">Quantas pessoas (incluindo você)?</Label>
                    <Input id="guest_count" name="guest_count" type="number" min={1} max={20} defaultValue={1} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Mensagem (opcional)</Label>
                    <Textarea id="message" name="message" rows={3} maxLength={500} />
                  </div>
                  <Button disabled={submitting} type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                    <Send className="mr-2 h-4 w-4" /> Enviar confirmação
                  </Button>
                </form>
              )}
            </div>
          )}

          <p className="mt-12 text-xs text-muted-foreground">
            Convite digital criado com <a href="/" className="text-primary hover:underline">Convite BR</a>
          </p>
        </div>
      </article>
    </main>
  );
}
