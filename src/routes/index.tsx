import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Globe, Heart, QrCode, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INVITE_TYPES } from "@/lib/invites";
import nebulaHero from "@/assets/nebula-hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Convite BR — Convites digitais Nebula Premium" },
      {
        name: "description",
        content: "Crie convites digitais elegantes para casamentos, aniversários, chá de bebê, formaturas e mais. RSVP integrado e link compartilhável.",
      },
    ],
  }),
});

function Landing() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="stars absolute inset-0" />
        <img
          src={nebulaHero}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-50"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-28 text-center sm:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Tema Nebula Premium · convites digitais brasileiros
          </div>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Convites que <span className="text-gradient">brilham</span>
            <br className="hidden sm:block" /> como o céu noturno.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Crie convites digitais elegantes para qualquer ocasião em poucos minutos. Compartilhe um
            link único, receba confirmações de presença e encante seus convidados.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 animate-pulse-glow"
            >
              <Link to="/auth">
                Criar meu convite grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5">
              <Link to="/convite/exemplo-casamento">Ver exemplo</Link>
            </Button>
          </div>

          {/* feature pills */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Globe, label: "Link único" },
              { icon: Send, label: "RSVP" },
              { icon: QrCode, label: "QR Code" },
              { icon: Heart, label: "9 modelos" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm">
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIPOS */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-5xl">
            Para cada <span className="text-gradient">momento</span>
          </h2>
          <p className="mt-3 text-muted-foreground">Escolha um tipo e personalize seu convite.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INVITE_TYPES.map((t, i) => (
            <Link
              key={t.value}
              to="/auth"
              className="group glass relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-10 blur-3xl transition group-hover:opacity-30" />
              <div className="text-4xl">{t.emoji}</div>
              <h3 className="mt-4 font-display text-2xl font-semibold">{t.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <div className="mt-6 inline-flex items-center text-sm font-medium text-primary">
                Criar convite <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-5xl">
            Como <span className="text-gradient">funciona</span>
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: "01", t: "Escolha o modelo", d: "9 categorias com layouts pensados para cada celebração." },
            { n: "02", t: "Personalize", d: "Edite nomes, data, local, mensagem e capa em tempo real." },
            { n: "03", t: "Compartilhe", d: "Envie o link, receba RSVP e acompanhe quem confirmou." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-3xl p-6">
              <div className="font-display text-4xl text-gradient">{s.n}</div>
              <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-4xl px-4 pb-24">
        <div className="glass relative overflow-hidden rounded-[2rem] p-10 text-center shadow-elegant">
          <div className="absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
          <Calendar className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Seu próximo evento merece um convite à altura
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Comece grátis. Edite quantas vezes quiser. Encante todo mundo.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
          >
            <Link to="/auth">
              Começar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Convite BR · Feito com <Heart className="inline h-3 w-3 text-primary" /> no Brasil
      </footer>
    </main>
  );
}
