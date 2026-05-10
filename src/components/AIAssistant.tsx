import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Wand2, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aiGeneratePhrase, aiSuggestDesign, aiSuggestPalette } from "@/lib/ai.functions";
import { THEMES } from "@/lib/editor-presets";

type Patch = {
  message?: string;
  theme?: string;
  font_family?: string;
  frame_style?: string;
  accent_color?: string;
};

export function AIAssistant({
  type, title, message,
  onApply,
}: {
  type: string; title?: string | null; message?: string | null;
  onApply: (patch: Patch) => void;
}) {
  const phraseFn = useServerFn(aiGeneratePhrase);
  const designFn = useServerFn(aiSuggestDesign);
  const paletteFn = useServerFn(aiSuggestPalette);
  const [tone, setTone] = useState("elegante e emotivo");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function gerarFrase() {
    setLoading("phrase");
    try {
      const r = await phraseFn({ data: { type, title: title || "", tone } });
      if (r.phrase) {
        onApply({ message: r.phrase });
        toast.success("Frase gerada!");
      }
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }

  async function sugerirDesign() {
    setLoading("design");
    try {
      const r = await designFn({ data: { type, title: title || "", message: message || "" } });
      onApply({ theme: r.theme, font_family: r.font, frame_style: r.frame, accent_color: r.accent });
      toast.success(`Design aplicado: ${r.reasoning}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }

  async function sugerirPaleta() {
    setLoading("palette");
    try {
      const r = await paletteFn({ data: { type, vibe } });
      // Find closest theme by accent or use a custom one — apply accent + match nearest theme by hue
      const nearest = THEMES.reduce((best, t) =>
        Math.abs(parseInt(t.accent.slice(1), 16) - parseInt(r.accent.slice(1), 16)) <
        Math.abs(parseInt(best.accent.slice(1), 16) - parseInt(r.accent.slice(1), 16)) ? t : best,
        THEMES[0]);
      onApply({ accent_color: r.accent, theme: nearest.id });
      toast.success(`Paleta "${r.mood}" aplicada`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }

  return (
    <div className="glass space-y-4 rounded-3xl p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-semibold">Assistente de IA</h3>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/10 p-4">
        <Label className="text-xs">Tom da frase</Label>
        <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="elegante / divertido / formal…" />
        <Button
          onClick={gerarFrase}
          disabled={loading !== null}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {loading === "phrase" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Gerar frase com IA
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/10 p-4">
        <Label className="text-xs">Sugestão automática de design</Label>
        <p className="text-xs text-muted-foreground">Aplica tema, fonte, moldura e cor de uma vez.</p>
        <Button
          onClick={sugerirDesign}
          disabled={loading !== null}
          variant="outline"
          className="w-full border-primary/30"
        >
          {loading === "design" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Sugerir design completo
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/10 p-4">
        <Label className="text-xs">Vibe da paleta (opcional)</Label>
        <Input value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="boho, minimalista, vintage…" />
        <Button
          onClick={sugerirPaleta}
          disabled={loading !== null}
          variant="outline"
          className="w-full border-primary/30"
        >
          {loading === "palette" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Palette className="mr-2 h-4 w-4" />}
          Gerar paleta de cores
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Powered by Lovable AI · Limites de uso e créditos podem se aplicar.
      </p>
    </div>
  );
}
