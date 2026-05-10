import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate } from "@/lib/invites";

export const Route = createFileRoute("/sorteio/$token")({
  component: Reveal,
  head: () => ({ meta: [{ title: "Amigo Secreto — Convite BR" }] }),
});

type Assignment = {
  participant_name: string;
  assigned_name: string | null;
  invite_title: string | null;
  event_date: string | null;
};

function Reveal() {
  const { token } = Route.useParams();
  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    supabase
      .rpc("get_secret_santa_assignment", { _token: token })
      .then(({ data }) => {
        const row = Array.isArray(data) && data.length > 0 ? (data[0] as Assignment) : null;
        setData(row);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Link inválido</h1>
        <p className="mt-2 text-muted-foreground">
          Este link de revelação não foi encontrado ou expirou.
        </p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-xl px-4 py-16">
      <div className="stars absolute inset-0 -z-10" />
      <article className="glass relative overflow-hidden rounded-[2rem] p-8 text-center shadow-elegant sm:p-12">
        <div className="absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
        <Gift className="mx-auto h-12 w-12 text-primary" />
        <p className="mt-3 text-xs uppercase tracking-[0.35em] text-primary">
          Amigo Secreto
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          {data.invite_title}
        </h1>
        {data.event_date && (
          <p className="mt-2 text-sm text-muted-foreground">
            {formatEventDate(data.event_date)}
          </p>
        )}

        <p className="mt-10 text-sm text-muted-foreground">
          Olá, <span className="font-medium text-foreground">{data.participant_name}</span>!
        </p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            <Sparkles className="h-5 w-5" /> Revelar meu sorteado
          </button>
        ) : data.assigned_name ? (
          <div className="mt-8 animate-fade-in">
            <p className="text-sm text-muted-foreground">Você tirou:</p>
            <p className="mt-3 font-display text-5xl font-semibold text-gradient sm:text-6xl">
              {data.assigned_name}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              Guarde esse segredo até o dia do evento 🤫
            </p>
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            O sorteio ainda não foi realizado pelo organizador.
          </p>
        )}
      </article>
    </main>
  );
}
