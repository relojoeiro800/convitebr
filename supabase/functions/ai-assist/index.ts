import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Mode =
  | "phrases"
  | "design"
  | "invite"
  | "colors"
  | "spellcheck";

const SYSTEM_PROMPTS: Record<Mode, string> = {
  phrases:
    "Você é um especialista brasileiro em convites. Gere 5 frases curtas, emocionantes e elegantes em português do Brasil para o tipo de evento informado. Retorne apenas a lista numerada, sem introdução.",
  design:
    "Você é um designer de convites digitais. Sugira 3 conceitos de design para o evento descrito: cada um com nome do estilo, paleta (3 cores em HEX), tipografia recomendada e clima visual. Use markdown.",
  invite:
    "Você é um redator criativo. Crie um convite completo em português do Brasil baseado nas informações fornecidas: título, mensagem principal (2-4 linhas) e chamada para confirmar presença. Tom elegante e caloroso. Markdown.",
  colors:
    "Você é especialista em teoria das cores. A partir do tema/clima informado, retorne uma paleta harmônica com 5 cores em HEX, cada uma com nome e finalidade (fundo, destaque, texto, etc.). Markdown.",
  spellcheck:
    "Você é um revisor de português do Brasil. Corrija ortografia, gramática e pontuação do texto informado. Retorne primeiro o texto corrigido em um bloco, e em seguida uma lista das alterações principais.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prompt } = (await req.json()) as { mode: Mode; prompt: string };

    if (!mode || !SYSTEM_PROMPTS[mode]) {
      return new Response(JSON.stringify({ error: "Modo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[mode] },
            { role: "user", content: prompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
