import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Crown, Building2, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Planos e Assinaturas — Convite BR" },
      { name: "description", content: "Escolha o plano ideal: Gratuito, Premium ou Empresarial. Convites digitais ilimitados, RSVP avançado e muito mais." },
    ],
  }),
});

type Plan = "free" | "premium" | "business";

const PLANS: Array<{
  id: Plan;
  name: string;
  price: string;
  period: string;
  highlight?: boolean;
  icon: typeof Crown;
  tagline: string;
  features: string[];
  limits?: string[];
}> = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    icon: Sparkles,
    tagline: "Comece a criar seus convites em minutos.",
    features: [
      "Até 2 convites ativos",
      "Templates essenciais",
      "RSVP básico",
      "Compartilhamento por link",
    ],
    limits: ["Marca d'água Convite BR"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 29,90",
    period: "/mês",
    highlight: true,
    icon: Crown,
    tagline: "Para quem quer um convite memorável.",
    features: [
      "Convites ilimitados",
      "Templates exclusivos premium",
      "Sem marca d'água",
      "Música personalizada de fundo",
      "RSVP avançado (limite, restrições, check-in)",
      "Painel completo + exportação PDF/Excel",
      "QR Code individual + scanner",
    ],
  },
  {
    id: "business",
    name: "Empresarial",
    price: "R$ 149,90",
    period: "/mês",
    icon: Building2,
    tagline: "Agências e equipes que entregam em escala.",
    features: [
      "Tudo do Premium",
      "Multiusuários por workspace",
      "White label (sua marca)",
      "Domínio personalizado",
      "API personalizada",
      "Suporte prioritário dedicado",
      "Relatórios avançados",
    ],
  },
];

function PlanosPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState<Plan | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_subscriptions").select("plan").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setCurrentPlan((data?.plan as Plan) ?? "free"));
  }, [user]);

  async function selectPlan(plan: Plan) {
    if (!user) { navigate({ to: "/auth" }); return; }
    setBusy(plan);
    const { error } = await supabase.from("user_subscriptions")
      .upsert({ user_id: user.id, plan, status: "active" }, { onConflict: "user_id" });
    setBusy(null);
    if (error) return toast.error(error.message);
    setCurrentPlan(plan);
    toast.success(plan === "free" ? "Plano gratuito ativado" : `Plano ${plan} selecionado!`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" asChild size="sm">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
          </Button>
          {user && (
            <Button variant="outline" asChild size="sm">
              <Link to="/dashboard">Meu painel</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Badge className="mb-4">Planos e assinaturas</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Escolha o plano perfeito para o seu evento
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece grátis e evolua quando precisar. Cancele a qualquer momento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative p-7 flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-glow ring-2 ring-primary/40 md:scale-[1.03]"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                    Mais popular
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-5 w-5 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">{plan.tagline}</p>

                <div className="mb-6">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.limits?.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4 shrink-0 mt-0.5 text-center">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={
                    plan.highlight
                      ? "w-full bg-gradient-primary text-primary-foreground shadow-glow"
                      : "w-full"
                  }
                  variant={plan.highlight ? "default" : isCurrent ? "secondary" : "outline"}
                  disabled={isCurrent || busy !== null}
                  onClick={() => selectPlan(plan.id)}
                >
                  {busy === plan.id
                    ? "Aguarde…"
                    : isCurrent
                    ? "Plano atual"
                    : plan.id === "free"
                    ? "Começar grátis"
                    : `Assinar ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          Precisa de algo personalizado?{" "}
          <a href="mailto:contato@convitebr.com" className="text-primary underline">
            Fale com nosso time
          </a>
          .
        </div>
      </main>
    </div>
  );
}
