export type InviteType =
  | "casamento"
  | "aniversario"
  | "cha_bebe"
  | "cha_revelacao"
  | "amigo_secreto"
  | "formatura"
  | "corporativo"
  | "infantil"
  | "religioso";

export const INVITE_TYPES: { value: InviteType; label: string; emoji: string; tagline: string }[] = [
  { value: "casamento", label: "Casamento", emoji: "💍", tagline: "Eternize o sim" },
  { value: "aniversario", label: "Aniversário", emoji: "🎂", tagline: "Mais um ciclo brilhante" },
  { value: "cha_bebe", label: "Chá de Bebê", emoji: "🍼", tagline: "Boas-vindas com ternura" },
  { value: "cha_revelacao", label: "Chá Revelação", emoji: "🎀", tagline: "O grande mistério" },
  { value: "amigo_secreto", label: "Amigo Secreto", emoji: "🎁", tagline: "Sorteio e diversão" },
  { value: "formatura", label: "Formatura", emoji: "🎓", tagline: "Conquistas em foco" },
  { value: "corporativo", label: "Corporativo", emoji: "🏢", tagline: "Eventos com presença" },
  { value: "infantil", label: "Festa Infantil", emoji: "🎈", tagline: "Magia para os pequenos" },
  { value: "religioso", label: "Evento Religioso", emoji: "✨", tagline: "Celebração de fé" },
];

export function inviteTypeLabel(t: string) {
  return INVITE_TYPES.find((x) => x.value === t)?.label ?? t;
}

export function slugify(text: string) {
  return (
    text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50) + "-" + Math.random().toString(36).slice(2, 7)
  );
}

export function formatEventDate(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
