import { Calendar, MapPin, Music, Video as VideoIcon } from "lucide-react";
import { FRAMES, fontCss, themePreset, type Sticker } from "@/lib/editor-presets";
import { INVITE_TYPES, formatEventDate, type InviteType } from "@/lib/invites";

type Props = {
  type: InviteType;
  title: string;
  host_names?: string | null;
  event_date?: string | null;
  location?: string | null;
  message?: string | null;
  cover_image_url?: string | null;
  video_url?: string | null;
  background_music_url?: string | null;
  theme: string;
  font_family?: string | null;
  accent_color?: string | null;
  frame_style?: string | null;
  stickers?: Sticker[];
  compact?: boolean;
  onStickerMove?: (id: string, x: number, y: number) => void;
};

export function InvitePreview(p: Props) {
  const theme = themePreset(p.theme);
  const accent = p.accent_color || theme.accent;
  const frame = FRAMES.find((f) => f.id === (p.frame_style ?? "none")) ?? FRAMES[0];
  const typeMeta = INVITE_TYPES.find((t) => t.value === p.type);
  const stickers = p.stickers ?? [];

  function startDrag(e: React.PointerEvent, id: string) {
    if (!p.onStickerMove) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    const parent = target.parentElement!;
    const rect = parent.getBoundingClientRect();
    function move(ev: PointerEvent) {
      const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
      p.onStickerMove?.(id, x, y);
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${frame.css ?? ""}`}
      style={{ background: theme.gradient, fontFamily: fontCss(p.font_family) }}
    >
      <div className="stars absolute inset-0 opacity-40" />
      <div className="relative px-6 py-10 text-center text-white sm:px-10 sm:py-14">
        {p.cover_image_url && (
          <img
            src={p.cover_image_url}
            alt=""
            className={`mx-auto mb-6 ${p.compact ? "h-36" : "h-56"} w-full max-w-md rounded-2xl object-cover shadow-elegant`}
          />
        )}
        {p.video_url && !p.compact && (
          <div className="mx-auto mb-6 max-w-md">
            <VideoEmbed url={p.video_url} />
          </div>
        )}
        <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: accent }}>
          {typeMeta?.label}
        </p>
        <h1 className={`mt-3 font-semibold leading-tight ${p.compact ? "text-3xl" : "text-4xl sm:text-5xl"}`}>
          {p.title || "Seu título aqui"}
        </h1>
        {p.host_names && <p className="mt-2 text-sm opacity-80">{p.host_names}</p>}

        {p.message && (
          <p className="mx-auto mt-6 max-w-md text-base italic opacity-90">"{p.message}"</p>
        )}

        <div className="mx-auto mt-8 grid max-w-md gap-2 text-left">
          {p.event_date && (
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
              <Calendar className="mt-0.5 h-4 w-4" style={{ color: accent }} />
              <p className="text-sm">{formatEventDate(p.event_date)}</p>
            </div>
          )}
          {p.location && (
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
              <MapPin className="mt-0.5 h-4 w-4" style={{ color: accent }} />
              <p className="text-sm">{p.location}</p>
            </div>
          )}
          {p.background_music_url && (
            <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3 text-xs backdrop-blur">
              <Music className="h-4 w-4" style={{ color: accent }} /> Música de fundo ativada
            </div>
          )}
        </div>

        {/* STICKERS */}
        {stickers.map((s) => (
          <div
            key={s.id}
            onPointerDown={(e) => startDrag(e, s.id)}
            className={`absolute select-none ${p.onStickerMove ? "cursor-grab active:cursor-grabbing" : ""}`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: `${s.size}px`,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
            }}
          >
            {s.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VideoEmbed({ url }: { url: string }) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${yt[1]}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          title="Vídeo"
        />
      </div>
    );
  }
  return (
    <video src={url} controls className="aspect-video w-full rounded-2xl bg-black" />
  );
}
