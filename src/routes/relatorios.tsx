import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Eye, Users, CheckCircle2, TrendingUp, DollarSign, Download, FileText,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteTypeLabel, formatEventDate, type InviteType } from "@/lib/invites";

export const Route = createFileRoute("/relatorios")({
  component: ReportsPage,
  head: () => ({ meta: [
    { title: "Relatórios — Convite BR" },
    { name: "description", content: "Visualizações, confirmações, conversão e relatórios financeiros dos seus convites." },
  ] }),
});

type Invite = {
  id: string; slug: string; title: string; type: InviteType;
  event_date: string | null; published: boolean; view_count: number; created_at: string;
};
type Rsvp = {
  id: string; invite_id: string; attending: boolean; guest_count: number;
  created_at: string; checked_in_at: string | null;
};
type Payment = {
  id: string; amount_cents: number; status: string; currency: string;
  description: string | null; created_at: string;
};

const RANGE_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
];

const PIE_COLORS = ["hsl(var(--primary))", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

function ReportsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [range, setRange] = useState("30");
  const [inviteFilter, setInviteFilter] = useState<string>("all");
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    Promise.all([
      supabase.from("invites").select("id,slug,title,type,event_date,published,view_count,created_at").order("created_at", { ascending: false }),
      supabase.from("rsvps").select("id,invite_id,attending,guest_count,created_at,checked_in_at"),
      supabase.from("payments").select("id,amount_cents,status,currency,description,created_at").order("created_at", { ascending: false }),
    ]).then(([i, r, p]) => {
      if (i.error) toast.error(i.error.message);
      setInvites((i.data ?? []) as Invite[]);
      setRsvps((r.data ?? []) as Rsvp[]);
      setPayments((p.data ?? []) as Payment[]);
    }).finally(() => setBusy(false));
  }, [user]);

  const sinceMs = useMemo(() => Date.now() - parseInt(range) * 86400000, [range]);

  const filtered = useMemo(() => {
    const inviteIds = new Set(
      inviteFilter === "all" ? invites.map((i) => i.id) : [inviteFilter]
    );
    return {
      invites: inviteFilter === "all" ? invites : invites.filter((i) => i.id === inviteFilter),
      rsvps: rsvps.filter((r) => inviteIds.has(r.invite_id) && new Date(r.created_at).getTime() >= sinceMs),
      payments: payments.filter((p) => new Date(p.created_at).getTime() >= sinceMs),
    };
  }, [invites, rsvps, payments, sinceMs, inviteFilter]);

  const totals = useMemo(() => {
    const views = filtered.invites.reduce((a, i) => a + (i.view_count || 0), 0);
    const confirmed = filtered.rsvps.filter((r) => r.attending).reduce((a, r) => a + (r.guest_count || 1), 0);
    const declined = filtered.rsvps.filter((r) => !r.attending).length;
    const checkins = filtered.rsvps.filter((r) => r.checked_in_at).length;
    const responses = filtered.rsvps.length;
    const conversion = views > 0 ? (responses / views) * 100 : 0;
    const revenue = filtered.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount_cents, 0);
    const pending = filtered.payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount_cents, 0);
    return { views, confirmed, declined, checkins, responses, conversion, revenue, pending };
  }, [filtered]);

  // Daily series for RSVPs (we don't track daily views, only total)
  const dailySeries = useMemo(() => {
    const days = parseInt(range);
    const map = new Map<string, { date: string; confirmacoes: number; recusas: number; receita: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: key, confirmacoes: 0, recusas: 0, receita: 0 });
    }
    filtered.rsvps.forEach((r) => {
      const k = r.created_at.slice(0, 10);
      const row = map.get(k); if (!row) return;
      if (r.attending) row.confirmacoes += r.guest_count || 1;
      else row.recusas += 1;
    });
    filtered.payments.filter((p) => p.status === "paid").forEach((p) => {
      const k = p.created_at.slice(0, 10);
      const row = map.get(k); if (!row) return;
      row.receita += p.amount_cents / 100;
    });
    return Array.from(map.values()).map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    }));
  }, [filtered, range]);

  const inviteRanking = useMemo(() => {
    return filtered.invites
      .map((i) => {
        const r = rsvps.filter((x) => x.invite_id === i.id);
        const conf = r.filter((x) => x.attending).reduce((a, x) => a + (x.guest_count || 1), 0);
        const conv = i.view_count > 0 ? (r.length / i.view_count) * 100 : 0;
        return { id: i.id, title: i.title, slug: i.slug, type: i.type, views: i.view_count || 0, confirmed: conf, conversion: conv };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [filtered.invites, rsvps]);

  const typeBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    filtered.invites.forEach((i) => m.set(i.type, (m.get(i.type) || 0) + (i.view_count || 0)));
    return Array.from(m.entries()).map(([type, value]) => ({ name: inviteTypeLabel(type as InviteType), value }));
  }, [filtered.invites]);

  function exportCSV() {
    const rows: string[] = [
      "Convite,Tipo,Data do evento,Publicado,Visualizações,Confirmados,Recusas,Conversão (%)",
    ];
    invites.forEach((i) => {
      const r = rsvps.filter((x) => x.invite_id === i.id);
      const conf = r.filter((x) => x.attending).reduce((a, x) => a + (x.guest_count || 1), 0);
      const dec = r.filter((x) => !x.attending).length;
      const conv = i.view_count > 0 ? ((r.length / i.view_count) * 100).toFixed(1) : "0";
      rows.push([
        JSON.stringify(i.title),
        inviteTypeLabel(i.type),
        i.event_date ? formatEventDate(i.event_date) : "—",
        i.published ? "Sim" : "Não",
        i.view_count, conf, dec, conv,
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-convites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  }

  if (loading || !user) return null;

  const fmtBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <main className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground">
            <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
          <h1 className="font-display text-4xl font-semibold">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe desempenho, confirmações e receita</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={inviteFilter} onValueChange={setInviteFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os convites</SelectItem>
              {invites.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="border-white/15 bg-white/5">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Eye, label: "Visualizações", value: totals.views.toLocaleString("pt-BR") },
          { icon: Users, label: "Confirmações", value: totals.confirmed.toLocaleString("pt-BR"), sub: `${totals.declined} recusas` },
          { icon: TrendingUp, label: "Conversão", value: `${totals.conversion.toFixed(1)}%`, sub: `${totals.responses} respostas` },
          { icon: DollarSign, label: "Receita paga", value: fmtBRL(totals.revenue), sub: `Pendente ${fmtBRL(totals.pending)}` },
        ].map((s) => (
          <div key={s.label} className="glass rounded-3xl p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 font-display text-3xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            {s.sub && <div className="mt-1 text-xs text-muted-foreground/70">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* CHART: daily activity */}
      <section className="glass mb-6 rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Atividade diária</h2>
            <p className="text-xs text-muted-foreground">Confirmações e recusas por dia</p>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary">{RANGE_OPTIONS.find((r) => r.value === range)?.label}</Badge>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <AreaChart data={dailySeries}>
              <defs>
                <linearGradient id="gConf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="confirmacoes" name="Confirmações" stroke="hsl(var(--primary))" fill="url(#gConf)" strokeWidth={2} />
              <Area type="monotone" dataKey="recusas" name="Recusas" stroke="#ec4899" fill="url(#gRec)" strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Pie: views by type */}
        <section className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Visualizações por tipo</h2>
          {typeBreakdown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Bar: revenue per day */}
        <section className="glass rounded-3xl p-6">
          <h2 className="mb-1 font-display text-xl font-semibold">Receita por dia</h2>
          <p className="mb-4 text-xs text-muted-foreground">Apenas pagamentos confirmados</p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={dailySeries}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Receita"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Ranking */}
      <section className="glass mb-6 rounded-3xl p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Top convites</h2>
        {inviteRanking.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum convite ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-3">Convite</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 text-right">Views</th>
                  <th className="pb-3 text-right">Confirmados</th>
                  <th className="pb-3 text-right">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inviteRanking.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3">
                      <Link to="/painel/$id" params={{ id: r.id }} className="font-medium hover:text-primary">
                        {r.title}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{inviteTypeLabel(r.type)}</td>
                    <td className="py-3 text-right tabular-nums">{r.views.toLocaleString("pt-BR")}</td>
                    <td className="py-3 text-right tabular-nums">{r.confirmed.toLocaleString("pt-BR")}</td>
                    <td className="py-3 text-right tabular-nums text-primary">{r.conversion.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Financial */}
      <section className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Relatório financeiro</h2>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        {filtered.payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Descrição</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3">{p.description ?? "—"}</td>
                    <td className="py-3">
                      <Badge variant={p.status === "paid" ? "default" : "secondary"}
                        className={p.status === "paid" ? "bg-primary/20 text-primary" : ""}>
                        {p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : p.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right tabular-nums">{fmtBRL(p.amount_cents)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={3} className="pt-4 text-right">Total pago</td>
                  <td className="pt-4 text-right tabular-nums text-primary">{fmtBRL(totals.revenue)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-xs text-muted-foreground">Pendente</td>
                  <td className="pt-1 text-right text-xs tabular-nums text-muted-foreground">{fmtBRL(totals.pending)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {busy && <p className="mt-6 text-center text-xs text-muted-foreground">Carregando…</p>}
    </main>
  );
}
