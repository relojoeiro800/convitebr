import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(body: object) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Configurações.");
  if (!res.ok) throw new Error(`Falha na IA (${res.status})`);
  return res.json();
}

/* ---------- Gerar frase ---------- */
export const aiGeneratePhrase = createServerFn({ method: "POST" })
  .inputValidator((d: { type: string; title?: string; tone?: string }) => d)
  .handler(async ({ data }) => {
    const tone = data.tone || "elegante e emotivo";
    const json = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: "Você cria frases curtas (máx. 25 palavras) em português brasileiro para convites digitais. Devolva apenas a frase, sem aspas." },
        { role: "user", content: `Tipo: ${data.type}. Título: ${data.title || "(sem título)"}. Tom: ${tone}. Gere UMA frase de convite marcante.` },
      ],
    });
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { phrase: text.replace(/^["'""]+|["'""]+$/g, "") };
  });

/* ---------- Sugestão de paleta ---------- */
const paletteSchema = {
  name: "suggest_palette",
  description: "Sugere uma paleta de cores e moldura para um convite.",
  parameters: {
    type: "object",
    properties: {
      gradient_from: { type: "string", description: "Cor hex inicial do gradiente, ex.: #0b1437" },
      gradient_via:  { type: "string", description: "Cor hex intermediária do gradiente" },
      gradient_to:   { type: "string", description: "Cor hex final do gradiente" },
      accent:        { type: "string", description: "Cor hex de destaque (botões/ícones)" },
      mood:          { type: "string", description: "Descrição curta do clima" },
    },
    required: ["gradient_from", "gradient_via", "gradient_to", "accent", "mood"],
    additionalProperties: false,
  },
};

export const aiSuggestPalette = createServerFn({ method: "POST" })
  .inputValidator((d: { type: string; vibe?: string }) => d)
  .handler(async ({ data }) => {
    const json = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: "Você é designer especialista em convites digitais. Devolva paletas harmônicas via tool call." },
        { role: "user", content: `Sugira uma paleta para um convite de ${data.type}${data.vibe ? `, vibe: ${data.vibe}` : ""}. Use cores sofisticadas e contraste suficiente para texto branco.` },
      ],
      tools: [{ type: "function", function: paletteSchema }],
      tool_choice: { type: "function", function: { name: "suggest_palette" } },
    });
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = z.object({
      gradient_from: z.string(), gradient_via: z.string(), gradient_to: z.string(),
      accent: z.string(), mood: z.string(),
    }).parse(JSON.parse(args || "{}"));
    return parsed;
  });

/* ---------- Sugestão de design completa ---------- */
const designSchema = {
  name: "suggest_design",
  description: "Sugere tema, fonte, moldura e cor de destaque.",
  parameters: {
    type: "object",
    properties: {
      theme:  { type: "string", enum: ["nebula","aurora","rose","gold","violet","blossom","ocean","forest","minimal"] },
      font:   { type: "string", enum: ["display","modern","script","mono","fun"] },
      frame:  { type: "string", enum: ["none","soft","glow","double","ornate"] },
      accent: { type: "string", description: "Cor hex" },
      reasoning: { type: "string" },
    },
    required: ["theme","font","frame","accent","reasoning"],
    additionalProperties: false,
  },
};

export const aiSuggestDesign = createServerFn({ method: "POST" })
  .inputValidator((d: { type: string; title?: string; message?: string }) => d)
  .handler(async ({ data }) => {
    const json = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: "Você é designer de convites. Recomende a combinação ideal de tema, fonte e moldura." },
        { role: "user", content: `Convite tipo: ${data.type}. Título: ${data.title || "—"}. Mensagem: ${data.message || "—"}.` },
      ],
      tools: [{ type: "function", function: designSchema }],
      tool_choice: { type: "function", function: { name: "suggest_design" } },
    });
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = z.object({
      theme: z.string(), font: z.string(), frame: z.string(),
      accent: z.string(), reasoning: z.string(),
    }).parse(JSON.parse(args || "{}"));
    return parsed;
  });
