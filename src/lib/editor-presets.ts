export type ThemePreset = {
  id: string;
  label: string;
  gradient: string; // CSS gradient
  accent: string;   // hex
};

export const THEMES: ThemePreset[] = [
  { id: "nebula",    label: "Nebula",    gradient: "linear-gradient(135deg,#0b1437 0%,#1e3a8a 50%,#06b6d4 100%)", accent: "#22d3ee" },
  { id: "aurora",    label: "Aurora",    gradient: "linear-gradient(135deg,#062e3f 0%,#0e7490 50%,#a7f3d0 100%)", accent: "#34d399" },
  { id: "rose",      label: "Rosé",      gradient: "linear-gradient(135deg,#3b0d2a 0%,#9d174d 50%,#fda4af 100%)", accent: "#fb7185" },
  { id: "gold",      label: "Royal",     gradient: "linear-gradient(135deg,#1c1917 0%,#78350f 50%,#fbbf24 100%)", accent: "#f59e0b" },
  { id: "violet",    label: "Violeta",   gradient: "linear-gradient(135deg,#1e1b4b 0%,#6d28d9 50%,#c084fc 100%)", accent: "#a78bfa" },
  { id: "blossom",   label: "Floral",    gradient: "linear-gradient(135deg,#3f1d1d 0%,#be185d 50%,#fde68a 100%)", accent: "#f472b6" },
  { id: "ocean",     label: "Oceano",    gradient: "linear-gradient(135deg,#082f49 0%,#0369a1 50%,#7dd3fc 100%)", accent: "#38bdf8" },
  { id: "forest",    label: "Floresta",  gradient: "linear-gradient(135deg,#022c22 0%,#065f46 50%,#bbf7d0 100%)", accent: "#10b981" },
  { id: "minimal",   label: "Mínimo",    gradient: "linear-gradient(135deg,#0a0a0a 0%,#1f1f1f 100%)",            accent: "#e5e5e5" },
];

export const FONTS = [
  { id: "display", label: "Elegante (Display)", css: "'Playfair Display', Georgia, serif" },
  { id: "modern",  label: "Moderno (Sans)",     css: "'Inter', system-ui, sans-serif" },
  { id: "script",  label: "Manuscrito",         css: "'Great Vibes', 'Dancing Script', cursive" },
  { id: "mono",    label: "Mono",               css: "'JetBrains Mono', 'Courier New', monospace" },
  { id: "fun",     label: "Divertido",          css: "'Fredoka', 'Comic Sans MS', sans-serif" },
];

export function fontCss(id?: string | null) {
  return FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css;
}

export function themePreset(id?: string | null) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export const STICKERS = [
  "✨","💖","🎉","🎊","🎈","🌟","💫","⭐","🌙","☁️",
  "🌸","🌺","🌷","🌹","🌻","🍀","🦋","🕊️","💐","🎀",
  "💍","👰","🤵","💞","💌","🥂","🍾","🎂","🧁","🍰",
  "🎁","🎄","🎅","🍼","👶","🍭","🎃","🎓","🏆","🙏",
];

export const FRAMES = [
  { id: "none",    label: "Sem moldura" },
  { id: "soft",    label: "Suave",        css: "ring-4 ring-white/10" },
  { id: "glow",    label: "Brilho",       css: "ring-2 ring-primary/40 shadow-[0_0_60px_rgba(34,211,238,0.35)]" },
  { id: "double",  label: "Dupla",        css: "ring-1 ring-white/40 outline outline-2 outline-offset-4 outline-white/10" },
  { id: "ornate",  label: "Ornamentada",  css: "ring-[3px] ring-amber-300/40 outline outline-1 outline-offset-2 outline-amber-200/30" },
];

export type Sticker = { id: string; emoji: string; x: number; y: number; size: number };
