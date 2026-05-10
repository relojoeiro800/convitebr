import type { InviteType } from "@/lib/invites";
import type { Sticker } from "@/lib/editor-presets";

export type Template = {
  id: string;
  label: string;
  premium: boolean;
  type: InviteType;
  theme: string;
  font_family: string;
  accent_color: string;
  frame_style: string;
  stickers?: Sticker[];
  message?: string;
};

const s = (emoji: string, x: number, y: number, size = 36): Sticker => ({
  id: `${emoji}-${x}-${y}-${Math.random().toString(36).slice(2, 6)}`, emoji, x, y, size,
});

export const TEMPLATES: Template[] = [
  // Casamento
  { id: "wed-royal", label: "Royal Eternal", premium: true, type: "casamento", theme: "gold",
    font_family: "script", accent_color: "#f59e0b", frame_style: "ornate",
    stickers: [s("✨",10,15,28), s("💍",90,18,40), s("🌹",12,88,34)],
    message: "Para sempre começa hoje." },
  { id: "wed-nebula", label: "Nebula Romance", premium: false, type: "casamento", theme: "violet",
    font_family: "display", accent_color: "#a78bfa", frame_style: "glow",
    stickers: [s("💞",88,12,32), s("✨",15,90,26)] },

  // Aniversário
  { id: "ani-gold", label: "Golden Hour", premium: true, type: "aniversario", theme: "gold",
    font_family: "display", accent_color: "#fbbf24", frame_style: "double",
    stickers: [s("🎂",90,15,40), s("🥂",10,88,36), s("✨",12,12,24)],
    message: "Mais um ciclo, e só motivos para brindar." },
  { id: "ani-fun", label: "Confete Pop", premium: false, type: "aniversario", theme: "rose",
    font_family: "fun", accent_color: "#fb7185", frame_style: "soft",
    stickers: [s("🎉",10,15,40), s("🎈",90,18,36), s("🎊",88,85,32)] },

  // Chá de bebê
  { id: "baby-soft", label: "Boas-vindas", premium: true, type: "cha_bebe", theme: "blossom",
    font_family: "script", accent_color: "#f472b6", frame_style: "soft",
    stickers: [s("🍼",88,18,36), s("👶",12,85,38), s("🌸",12,15,28)],
    message: "Pequenos pés, gigante alegria." },

  // Chá revelação
  { id: "rev-mystery", label: "Mistério Cintilante", premium: true, type: "cha_revelacao", theme: "violet",
    font_family: "display", accent_color: "#c084fc", frame_style: "glow",
    stickers: [s("🎀",90,15,38), s("✨",10,88,30), s("💫",12,12,26)],
    message: "Rosa ou azul? Em breve, o mistério se revela." },

  // Amigo secreto
  { id: "santa-classic", label: "Festivo", premium: false, type: "amigo_secreto", theme: "forest",
    font_family: "modern", accent_color: "#10b981", frame_style: "soft",
    stickers: [s("🎁",90,15,40), s("🎄",10,85,38)] },

  // Formatura
  { id: "form-elite", label: "Elite Graduate", premium: true, type: "formatura", theme: "nebula",
    font_family: "display", accent_color: "#22d3ee", frame_style: "double",
    stickers: [s("🎓",90,15,40), s("🏆",10,85,36), s("✨",12,15,24)],
    message: "Cada conquista tem sua estrela." },

  // Corporativo
  { id: "corp-min", label: "Executive", premium: true, type: "corporativo", theme: "minimal",
    font_family: "modern", accent_color: "#e5e5e5", frame_style: "soft" },

  // Festa infantil
  { id: "kid-magic", label: "Magia Infantil", premium: false, type: "infantil", theme: "rose",
    font_family: "fun", accent_color: "#fb7185", frame_style: "soft",
    stickers: [s("🎈",90,15,40), s("🧁",10,85,36), s("🎉",12,15,30)] },

  // Religioso
  { id: "rel-soft", label: "Celebração", premium: true, type: "religioso", theme: "ocean",
    font_family: "script", accent_color: "#38bdf8", frame_style: "ornate",
    stickers: [s("🕊️",90,15,38), s("🙏",10,85,34), s("✨",12,15,24)],
    message: "Em comunhão e gratidão." },
];

export function templatesFor(type: InviteType) {
  return TEMPLATES.filter((t) => t.type === type);
}
