import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users, FileText, DollarSign, Eye, ShieldAlert, FolderTree,
  CheckCircle2, XCircle, Trash2, UserX, UserCheck, ScrollText, LayoutDashboard,
} from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PlanValue = "free" | "premium" | "premium_pro" | "business";

const PLAN_OPTIONS: Array<{ value: PlanValue; label: string }> = [
  { value: "free", label: "Grátis" },
  { value: "premium", label: "Premium" },
  { value: "premium_pro", label: "Premium Profissional" },
  { value: "business", label: "Business" },
];
const planLabel = (v: string) => PLAN_OPTIONS.find((p) => p.value === v)?.label ?? v;

// Limites por plano (null = ilimitado)
const PLAN_LIMITS: Record<PlanValue, { maxInvites: number | null; maxGuests: number | null; maxPublished: number | null }> = {
  free:        { maxInvites: 2,  maxGuests: 50,  maxPublished: 1 },
  premium:     { maxInvites: 10, maxGuests: 200, maxPublished: 5 },
  premium_pro: { maxInvites: 50, maxGuests: 500, maxPublished: 20 },
  business:    { maxInvites: null, maxGuests: null, maxPublished: null },
};

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
  head: () => ({ meta: [{ title: "Painel Admin — Convite BR" }] }),
});

type Stats = {
  total_users: number; total_invites: number; published_invites: number;
  total_rsvps: number; monthly_revenue_cents: number; total_revenue_cents: number;
  pending_templates: number; suspended_users: number;
  top_invites: Array<{ id: string; title: string; slug: string; view_count: number }>;
  recent_users: Array<{ id: string; full_name: string | null; created_at: string }>;
  revenue_by_day: Array<{ day: string; amount_cents: number }>;
};

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);

function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  const refresh = async () => {
    const { data, error } = await supabase.rpc("get_admin_stats");
    if (error) { toast.error(error.message); return; }
    setStats(data as unknown as Stats);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (loading || isAdmin === null) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <Card className="p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Você precisa ser administrador para acessar este painel.
          </p>
          <Button asChild><Link to="/dashboard">Voltar ao dashboard</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Painel Administrativo</h1>
          </div>
          <Button variant="ghost" asChild><Link to="/dashboard">Sair do admin</Link></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <StatGrid stats={stats} />

        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <DashboardCharts stats={stats} />
          </TabsContent>
          <TabsContent value="users" className="mt-6"><UsersPanel onChange={refresh} /></TabsContent>
          <TabsContent value="templates" className="mt-6"><TemplatesPanel onChange={refresh} /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesPanel /></TabsContent>
          <TabsContent value="payments" className="mt-6"><PaymentsPanel onChange={refresh} /></TabsContent>
          <TabsContent value="logs" className="mt-6"><LogsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatGrid({ stats }: { stats: Stats | null }) {
  const cards = [
    { label: "Usuários", value: stats?.total_users ?? "—", icon: Users },
    { label: "Convites", value: stats?.total_invites ?? "—", icon: FileText },
    { label: "Receita mensal", value: stats ? fmtBRL(stats.monthly_revenue_cents) : "—", icon: DollarSign },
    { label: "Receita total", value: stats ? fmtBRL(stats.total_revenue_cents) : "—", icon: DollarSign },
    { label: "Convites publicados", value: stats?.published_invites ?? "—", icon: Eye },
    { label: "Templates pendentes", value: stats?.pending_templates ?? "—", icon: FolderTree },
    { label: "Confirmações", value: stats?.total_rsvps ?? "—", icon: CheckCircle2 },
    { label: "Suspensos", value: stats?.suspended_users ?? "—", icon: UserX },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <c.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-semibold mt-2">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

function DashboardCharts({ stats }: { stats: Stats | null }) {
  const revenueData = useMemo(
    () => (stats?.revenue_by_day ?? []).map((r) => ({ day: r.day.slice(5), value: (r.amount_cents || 0) / 100 })),
    [stats]
  );
  const topData = useMemo(
    () => (stats?.top_invites ?? []).map((i) => ({ name: i.title.slice(0, 18), views: i.view_count })),
    [stats]
  );
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Receita (últimos 30 dias)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Convites mais acessados</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-5 lg:col-span-2">
        <h3 className="font-semibold mb-4">Novos usuários</h3>
        <div className="space-y-2">
          {(stats?.recent_users ?? []).map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
              <span>{u.full_name || u.id.slice(0, 8)}</span>
              <span className="text-muted-foreground">{new Date(u.created_at).toLocaleString("pt-BR")}</span>
            </div>
          ))}
          {(stats?.recent_users ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

type ProfileRow = { id: string; full_name: string | null; created_at: string };
type SuspendRow = { user_id: string; reason: string | null };

function UsersPanel({ onChange }: { onChange: () => void }) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [suspended, setSuspended] = useState<Record<string, string | null>>({});
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    const [{ data: p }, { data: s }, { data: r }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("suspended_accounts").select("user_id,reason"),
      supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
      supabase.from("user_subscriptions").select("user_id,plan"),
    ]);
    setProfiles((p ?? []) as ProfileRow[]);
    const map: Record<string, string | null> = {};
    ((s ?? []) as SuspendRow[]).forEach((x) => { map[x.user_id] = x.reason; });
    setSuspended(map);
    setAdmins(new Set(((r ?? []) as Array<{ user_id: string }>).map((x) => x.user_id)));
    const pmap: Record<string, string> = {};
    ((subs ?? []) as Array<{ user_id: string; plan: string }>).forEach((x) => { pmap[x.user_id] = x.plan; });
    setPlans(pmap);
  };
  useEffect(() => { load(); }, []);

  const setUserPlan = async (userId: string, plan: PlanValue) => {
    const current = (plans[userId] as PlanValue) ?? "free";
    if (current === plan) return;

    // Buscar convites do usuário para validar limites
    const { data: invites, error: invErr } = await supabase
      .from("invites")
      .select("id,published,max_guests")
      .eq("user_id", userId);
    if (invErr) return toast.error("Erro ao validar limites: " + invErr.message);

    const limits = PLAN_LIMITS[plan];
    const total = invites?.length ?? 0;
    const published = (invites ?? []).filter((i) => i.published).length;
    const maxGuestUsed = (invites ?? []).reduce((m, i) => Math.max(m, i.max_guests ?? 0), 0);

    const errors: string[] = [];
    if (limits.maxInvites !== null && total > limits.maxInvites) {
      errors.push(`Usuário possui ${total} convites — plano ${planLabel(plan)} permite até ${limits.maxInvites}.`);
    }
    if (limits.maxPublished !== null && published > limits.maxPublished) {
      errors.push(`Usuário tem ${published} convites publicados — plano ${planLabel(plan)} permite até ${limits.maxPublished}.`);
    }
    if (limits.maxGuests !== null && maxGuestUsed > limits.maxGuests) {
      errors.push(`Um convite usa limite de ${maxGuestUsed} convidados — plano ${planLabel(plan)} permite até ${limits.maxGuests}.`);
    }
    if (errors.length) {
      toast.error("Mudança de plano bloqueada", {
        description: errors.join(" "),
        duration: 8000,
      });
      return;
    }

    const { error } = await supabase
      .from("user_subscriptions")
      .upsert({ user_id: userId, plan, status: "active" }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success(`Plano atualizado: ${planLabel(plan)}`);
    load();
  };

  const toggleSuspend = async (userId: string) => {
    if (suspended[userId] !== undefined) {
      const { error } = await supabase.from("suspended_accounts").delete().eq("user_id", userId);
      if (error) return toast.error(error.message);
      toast.success("Conta reativada");
    } else {
      const reason = prompt("Motivo da suspensão?") || "Suspenso pelo admin";
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("suspended_accounts").insert({
        user_id: userId, reason, suspended_by: u.user!.id,
      });
      if (error) return toast.error(error.message);
      toast.success("Conta suspensa");
    }
    load(); onChange();
  };

  const toggleAdmin = async (userId: string) => {
    if (admins.has(userId)) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
    }
    load();
  };

  const filtered = profiles.filter((p) =>
    !search || (p.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  );

  return (
    <Card className="p-5 space-y-4">
      <div className="flex justify-between items-center gap-3">
        <h3 className="font-semibold">Usuários ({profiles.length})</h3>
        <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      <div className="divide-y">
        {filtered.map((p) => (
          <div key={p.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-medium flex items-center gap-2">
                {p.full_name || p.id.slice(0, 8)}
                {admins.has(p.id) && <Badge>Admin</Badge>}
                {plans[p.id] && <Badge variant="secondary">{planLabel(plans[p.id])}</Badge>}
                {suspended[p.id] !== undefined && <Badge variant="destructive">Suspenso</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{p.id}</div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Select
                value={plans[p.id] ?? "free"}
                onValueChange={(v) => setUserPlan(p.id, v as PlanValue)}
              >
                <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Plano" /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => toggleAdmin(p.id)}>
                {admins.has(p.id) ? "Remover admin" : "Tornar admin"}
              </Button>
              <Button size="sm" variant={suspended[p.id] !== undefined ? "outline" : "destructive"} onClick={() => toggleSuspend(p.id)}>
                {suspended[p.id] !== undefined ? <><UserCheck className="h-4 w-4 mr-1" />Reativar</> : <><UserX className="h-4 w-4 mr-1" />Suspender</>}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum usuário.</p>}
      </div>
    </Card>
  );
}

type TemplateRow = {
  id: string; name: string; description: string | null; type: string;
  status: string; is_premium: boolean; price_cents: number; created_at: string; created_by: string;
};

function TemplatesPanel({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = async () => {
    const { data, error } = await supabase
      .from("admin_templates")
      .select("id,name,description,type,status,is_premium,price_cents,created_at,created_by")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as TemplateRow[]);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("admin_templates").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Template " + status);
    load(); onChange();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir template?")) return;
    const { error } = await supabase.from("admin_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load(); onChange();
  };

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex justify-between flex-wrap gap-3 items-center">
        <h3 className="font-semibold">Templates ({items.length})</h3>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "approved" ? "Aprovados" : "Rejeitados"}
            </Button>
          ))}
        </div>
      </div>
      <div className="divide-y">
        {filtered.map((t) => (
          <div key={t.id} className="py-3 flex justify-between items-start gap-3 flex-wrap">
            <div>
              <div className="font-medium flex items-center gap-2">
                {t.name}
                <Badge variant={t.status === "approved" ? "default" : t.status === "rejected" ? "destructive" : "secondary"}>
                  {t.status}
                </Badge>
                {t.is_premium && <Badge>Premium · {fmtBRL(t.price_cents)}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{t.type} · {t.description?.slice(0, 80)}</div>
            </div>
            <div className="flex gap-2">
              {t.status !== "approved" && (
                <Button size="sm" onClick={() => setStatus(t.id, "approved")}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />Aprovar
                </Button>
              )}
              {t.status !== "rejected" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(t.id, "rejected")}>
                  <XCircle className="h-4 w-4 mr-1" />Rejeitar
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => remove(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum template.</p>}
      </div>
    </Card>
  );
}

type CatRow = { id: string; name: string; slug: string; description: string | null };
function CategoriesPanel() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");

  const load = async () => {
    const { data } = await supabase.from("template_categories").select("*").order("name");
    setCats((data ?? []) as CatRow[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("template_categories").insert({ name, slug, description: desc || null });
    if (error) return toast.error(error.message);
    setName(""); setDesc(""); setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    await supabase.from("template_categories").delete().eq("id", id);
    load();
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Categorias ({cats.length})</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">Nova categoria</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar categoria</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Descrição</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="divide-y">
        {cats.map((c) => (
          <div key={c.id} className="py-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{c.name} <span className="text-xs text-muted-foreground">/{c.slug}</span></div>
              {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
            </div>
            <Button size="sm" variant="destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {cats.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma categoria.</p>}
      </div>
    </Card>
  );
}

type PaymentRow = {
  id: string; user_id: string; amount_cents: number; currency: string;
  status: string; provider: string | null; description: string | null; created_at: string;
};

function PaymentsPanel({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const load = async () => {
    const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200);
    setItems((data ?? []) as PaymentRow[]);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    load(); onChange();
  };

  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-semibold">Pagamentos ({items.length})</h3>
      <div className="divide-y">
        {items.map((p) => (
          <div key={p.id} className="py-3 flex justify-between items-center gap-3 flex-wrap">
            <div>
              <div className="font-medium flex items-center gap-2">
                {fmtBRL(p.amount_cents)}
                <Badge variant={p.status === "paid" ? "default" : p.status === "failed" || p.status === "refunded" ? "destructive" : "secondary"}>
                  {p.status}
                </Badge>
                {p.provider && <Badge variant="outline">{p.provider}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.description || "—"} · {new Date(p.created_at).toLocaleString("pt-BR")} · {p.user_id.slice(0, 8)}
              </div>
            </div>
            <div className="flex gap-2">
              {p.status !== "paid" && <Button size="sm" onClick={() => setStatus(p.id, "paid")}>Marcar pago</Button>}
              {p.status !== "refunded" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "refunded")}>Reembolsar</Button>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum pagamento registrado.</p>}
      </div>
    </Card>
  );
}

type LogRow = {
  id: string; actor_id: string | null; action: string; target_type: string | null;
  target_id: string | null; metadata: Record<string, unknown>; created_at: string;
};

function LogsPanel() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  useEffect(() => {
    supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setLogs((data ?? []) as LogRow[]));
  }, []);
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold flex items-center gap-2"><ScrollText className="h-4 w-4" /> Logs do sistema</h3>
      <div className="divide-y text-sm">
        {logs.map((l) => (
          <div key={l.id} className="py-2 flex justify-between gap-3">
            <div>
              <span className="font-medium">{l.action}</span>
              {l.target_type && <span className="text-muted-foreground"> · {l.target_type}</span>}
            </div>
            <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-muted-foreground py-6 text-center">Nenhum log ainda.</p>}
      </div>
    </Card>
  );
}
