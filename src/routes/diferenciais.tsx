import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Video, Music, Brain, QrCode, Globe, CalendarRange, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/diferenciais")({
  component: DiferenciaisPage,
  head: () => ({
    meta: [
      { title: "Diferenciais — Convite BR" },
      { name: "description", content: "Convites animados, vídeo, áudio personalizado, IA, QR Code de check-in, página exclusiva e multi-eventos em uma só plataforma." },
      { property: "og:title", content: "Diferenciais — Convite BR" },
      { property: "og:description", content: "Recursos exclusivos que tornam seus convites inesquecíveis." },
    ],
  }),
});

const FEATURES = [
  {
    icon: Sparkles,
    title: "Convites animados",
    desc: "Animações fluidas, gradientes nebulares e micro-interações que encantam à primeira vista.",
  },
  {
    icon: Video,
    title: "Vídeo convite",
    desc: "Adicione um vídeo de capa em qualquer convite — perfeito para mensagens dos noivos ou aftermovie.",
  },
  {
    icon: Music,
    title: "Áudio personalizado",
    desc: "Trilha sonora própria que toca ao abrir o convite. Defina a emoção do primeiro segundo.",
  },
  {
    icon: Brain,
    title: "IA integrada",
    desc: "Geração de textos, sugestões criativas e mensagens automáticas com Lovable AI — sem chave de API.",
  },
  {
    icon: QrCode,
    title: "Check-in QR Code",
    desc: "Cada convidado recebe um QR único. No dia do evento, faça o check-in em segundos pelo celular.",
  },
  {
    icon: Globe,
    title: "Página personalizada",
    desc: "URL própria (ex: convite.br/joao-maria), tema Nebula, cores, fontes e estilo totalmente seus.",
  },
  {
    icon: CalendarRange,
    title: "Sistema multi-eventos",
    desc: "Gerencie casamento, chá, despedida e aniversário no mesmo painel — convites ilimitados em um só lugar.",
  },
];

function DiferenciaisPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 glass-subtle sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold">Convite BR</Link>
          <Link to="/dashboard"><Button variant="ghost" size="sm">Painel</Button></Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 glass-subtle px-4 py-2 rounded-full mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm">Recursos exclusivos</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
          Diferenciais que <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">encantam</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in">
          Tudo o que você precisa para criar convites memoráveis — em uma única plataforma premium.
        </p>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="glass rounded-2xl p-6 hover-lift hover-glow transition-smooth animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 shadow-glow">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold mb-2">{f.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              Criar meu convite agora
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
