import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Users, CheckCircle2, XCircle, Clock, FileSpreadsheet, FileText, Search, Mail, Phone, QrCode,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/painel/$id")({
  component: PainelPage,
  head: () => ({ meta: [{ title: "Painel de presenças — Convite BR" }] }),
});

type Rsvp = {
  id: string; guest_name: string; attending: boolean; guest_count: number;
  message: string | null; notes: string | null; email: string | null; phone: string | null;
  created_at: string;
};
type Invite = { id: string; title: string; slug: string; max_guests: number | null; user_id: string };

function PainelPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Invite | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("invites").select("id,title,slug,max_guests,user_id").eq("id", id).maybeSingle()
      .then(({ data, error }) => {
        if (error) return toast.error(error.message);
        setInv(data as Invite);
      });
    supabase.from("rsvps").select("*").eq("invite_id", id).order("created_at", { ascending: false })
      .then(({ data }) => setRsvps((data ?? []) as Rsvp[]));

    const ch = supabase.channel(`rsvps:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps", filter: `invite_id=eq.${id}` },
        (payload) => {
          if (payload.eventType === "INSERT") setRsvps((p) => [payload.new as Rsvp, ...p]);
          else if (payload.eventType === "DELETE") setRsvps((p) => p.filter((r) => r.id !== (payload.old as Rsvp).id));
          else if (payload.eventType === "UPDATE") setRsvps((p) => p.map((r) => r.id === (payload.new as Rsvp).id ? payload.new as Rsvp : r));
        }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, id]);

  const stats = useMemo(() => {
    const confirmed = rsvps.filter((r) => r.attending);
    const declined = rsvps.filter((r) => !r.attending);
    const totalGuests = confirmed.reduce((a, r) => a + (r.guest_count || 1), 0);
    const max = inv?.max_guests ?? null;
    const pending = max ? Math.max(0, max - totalGuests) : null;
    return { confirmed, declined, totalGuests, pending, max };
  }, [rsvps, inv]);

  const filtered = (list: Rsvp[]) => list.filter((r) =>
    !search || r.guest_name.toLowerCase().includes(search.toLowerCase())
    || (r.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = rsvps.map((r) => ({
      Nome: r.guest_name, Status: r.attending ? "Confirmado" : "Recusado",
      Acompanhantes: r.guest_count, Email: r.email ?? "", WhatsApp: r.phone ?? "",
      Mensagem: r.message ?? "", Observacoes: r.notes ?? "",
      Data: new Date(r.created_at).toLocaleString("pt-BR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presenças");
    XLSX.writeFile(wb, `presencas-${inv?.slug ?? id}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Lista de presença — ${inv?.title ?? ""}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Confirmados: ${stats.confirmed.length} · Total convidados: ${stats.totalGuests} · Recusados: ${stats.declined.length}`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Nome", "Status", "Pessoas", "Contato", "Observações"]],
      body: rsvps.map((r) => [
        r.guest_name,
        r.attending ? "Confirmado" : "Recusado",
        String(r.guest_count),
        [r.email, r.phone].filter(Boolean).join(" / "),
        r.notes ?? "",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(`presencas-${inv?.slug ?? id}.pdf`);
  }

  if (loading || !inv) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  const pieData = [
    { name: "Confirmados", value: stats.confirmed.length, color: "hsl(var(--primary))" },
    { name: "Recusados", value: stats.declined.length, color: "hsl(var(--destructive))" },
  ];
  const days = lastDaysBuckets(rsvps, 7);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
      </Button>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Painel de presenças</h1>
          <p className="text-sm text-muted-foreground">{inv.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/checkin/$id" params={{ id: inv.id }}><QrCode className="mr-2 h-4 w-4" /> Check-in</Link>
          </Button>
          <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={exportPdf}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
        </div>
      </div>

      {/* STATS */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Confirmados" value={stats.confirmed.length} />
        <StatCard icon={Users} label="Total de convidados" value={stats.totalGuests} sub={stats.max ? `de ${stats.max}` : undefined} />
        <StatCard icon={Clock} label="Vagas restantes" value={stats.pending ?? "—"} />
        <StatCard icon={XCircle} label="Recusados" value={stats.declined.length} />
      </div>

      {/* CHARTS */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Distribuição</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Confirmações nos últimos 7 dias</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={days}>
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} />
                <YAxis stroke="currentColor" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SEARCH + LIST */}
      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Tabs defaultValue="confirmed">
          <TabsList>
            <TabsTrigger value="confirmed">Confirmados ({stats.confirmed.length})</TabsTrigger>
            <TabsTrigger value="declined">Recusados ({stats.declined.length})</TabsTrigger>
            <TabsTrigger value="all">Todos ({rsvps.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="confirmed" className="mt-4"><GuestList rows={filtered(stats.confirmed)} /></TabsContent>
          <TabsContent value="declined" className="mt-4"><GuestList rows={filtered(stats.declined)} /></TabsContent>
          <TabsContent value="all" className="mt-4"><GuestList rows={filtered(rsvps)} /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; sub?: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-display text-3xl font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        {sub && <span className="ml-1 text-sm font-normal text-muted-foreground">{sub}</span>}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function GuestList({ rows }: { rows: Rsvp[] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum convidado nessa categoria.</p>;
  return (
    <ul className="divide-y divide-white/5">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">{r.guest_name}</p>
              <Badge variant={r.attending ? "default" : "secondary"} className={r.attending ? "bg-primary/20 text-primary" : ""}>
                {r.attending ? `Vai · ${r.guest_count}` : "Não vai"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {r.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.email}</span>}
              {r.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {r.phone}</span>}
            </div>
            {r.message && <p className="mt-1 text-xs italic text-muted-foreground">"{r.message}"</p>}
            {r.notes && <p className="mt-1 text-xs text-muted-foreground"><strong>Obs:</strong> {r.notes}</p>}
          </div>
          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
        </li>
      ))}
    </ul>
  );
}

function lastDaysBuckets(rsvps: Rsvp[], n: number) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets: { day: string; count: number; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    buckets.push({ day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), count: 0, key: d.toISOString().slice(0, 10) });
  }
  rsvps.forEach((r) => {
    const k = new Date(r.created_at).toISOString().slice(0, 10);
    const b = buckets.find((b) => b.key === k);
    if (b) b.count += 1;
  });
  return buckets;
}
