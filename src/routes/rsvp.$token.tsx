import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, XCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QRCode } from "@/components/QRCode";
import { formatEventDate } from "@/lib/invites";

export const Route = createFileRoute("/rsvp/$token")({
  component: RsvpPage,
  head: () => ({ meta: [{ title: "Comprovante de presença — Convite BR" }] }),
});

type Row = {
  id: string; guest_name: string; attending: boolean; guest_count: number;
  message: string | null; notes: string | null; created_at: string;
  invite_title: string; event_date: string | null; slug: string;
};

function RsvpPage() {
  const { token } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_rsvp_by_token", { _token: token }).then(({ data }) => {
      const r = (Array.isArray(data) ? data[0] : null) as Row | null;
      setRow(r);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;
  if (!row) return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Comprovante não encontrado</h1>
      <p className="mt-2 text-muted-foreground">O link pode estar incorreto.</p>
    </main>
  );

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="glass rounded-3xl p-8 text-center shadow-elegant">
        {row.attending
          ? <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          : <XCircle className="mx-auto h-12 w-12 text-destructive" />}
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          {row.attending ? "Presença confirmada" : "Ausência registrada"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">{row.guest_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{row.invite_title}</p>

        {row.event_date && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            {formatEventDate(row.event_date)}
          </div>
        )}

        {row.attending && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm text-primary">
            <Users className="h-4 w-4" /> {row.guest_count} {row.guest_count > 1 ? "pessoas" : "pessoa"}
          </div>
        )}

        {row.notes && (
          <p className="mt-5 rounded-2xl bg-secondary p-3 text-left text-xs text-muted-foreground">
            <strong className="block">Observações:</strong> {row.notes}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          <QRCode value={typeof window !== "undefined" ? window.location.href : ""} size={180} />
          <p className="text-xs text-muted-foreground">Apresente este QR Code na entrada do evento</p>
        </div>

        <Link to="/convite/$slug" params={{ slug: row.slug }} className="mt-6 inline-block text-xs text-primary hover:underline">
          Ver convite completo
        </Link>
      </div>
    </main>
  );
}
