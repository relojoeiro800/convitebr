import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Wand2, Palette, FileText, SpellCheck, Loader2, Copy, ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

export const Route = createFileRoute("/ia")({
  component: IAPage,
  head: () => ({
    meta: [
      { title: "Inteligência Artificial — Convite BR" },
      { name: "description", content: "Recursos de IA para criar convites: frases, design, paletas, correção e mais." },
    ],
  }),
});

type Mode = "phrases" | "design" | "invite" | "colors" | "spellcheck";

const TOOLS: {
  mode: Mode;
  icon: typeof Sparkles;
  title: string;
  description: string;
  placeholder: string;
  cta: string;
}[] = [
  {
    mode: "phrases",
    icon: Sparkles,
    title: "Gerador de frases",
    description: "Frases prontas para o seu convite, em segundos.",
    placeholder: "Ex.: Casamento elegante de Ana e João, clima romântico ao ar livre",
    cta: "Gerar frases",
  },
  {
    mode: "design",
    icon: Wand2,
    title: "Sugestão de design",
    description: "Conceitos visuais com paleta e tipografia.",
    placeholder: "Ex.: Aniversário infantil tema safári, alegre e colorido",
    cta: "Sugerir design",
  },
  {
    mode: "invite",
    icon: FileText,
    title: "Criação automática de convite",
    description: "Texto completo do seu convite, do título à confirmação.",
    placeholder: "Ex.: Chá de bebê de Mariana, dia 12/05, 15h, casa da vovó. Tema: nuvens",
    cta: "Criar convite",
  },
  {
    mode: "colors",
    icon: Palette,
    title: "Ajuste automático de cores",
    description: "Paleta harmônica baseada no clima do evento.",
    placeholder: "Ex.: Casamento boho ao pôr do sol, tons quentes",
    cta: "Gerar paleta",
  },
  {
    mode: "spellcheck",
    icon: SpellCheck,
    title: "Correção ortográfica",
    description: "Cole seu texto e receba a versão revisada.",
    placeholder: "Cole aqui o texto que você quer revisar…",
    cta: "Revisar texto",
  },
];

function IAPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<Mode>("phrases");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const tool = TOOLS.find((t) => t.mode === active)!;

  async function run() {
    if (!prompt.trim()) {
      toast.error("Digite uma instrução para a IA.");
      return;
    }
    setBusy(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: { mode: active, prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data?.text ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na IA");
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result);
    toast.success("Copiado!");
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Inteligência Artificial
          </div>
          <h1 className="font-display text-4xl font-semibold mt-1">Crie com IA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recursos inteligentes para acelerar a criação dos seus convites.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15 bg-white/5">
          <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar de ferramentas */}
        <aside className="space-y-2">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = t.mode === active;
            return (
              <button
                key={t.mode}
                onClick={() => { setActive(t.mode); setResult(""); setPrompt(""); }}
                className={`glass w-full rounded-2xl p-4 text-left transition ${
                  isActive ? "ring-2 ring-primary shadow-glow" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Painel principal */}
        <section className="glass rounded-3xl p-6">
          <div className="mb-2 flex items-center gap-2">
            <tool.icon className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold">{tool.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{tool.description}</p>

          <div className="mt-5 space-y-2">
            <Label htmlFor="prompt">Sua instrução</Label>
            <Textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={tool.placeholder}
              className="resize-none"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={run}
              disabled={busy}
              className="bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…</>) : (<><Sparkles className="mr-2 h-4 w-4" /> {tool.cta}</>)}
            </Button>
          </div>

          {result && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-background/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Resultado</p>
                <Button size="sm" variant="ghost" onClick={copyResult}>
                  <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
