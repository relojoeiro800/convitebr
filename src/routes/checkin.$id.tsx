import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ArrowLeft, CheckCircle2, XCircle, Search, UserCheck, Camera, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/checkin/$id")({
  component: CheckinPage,
  head: () => ({ meta: [{ title: "Check-in — Convite BR" }] }),
});

type Rsvp = {
  id: string; guest_name: string; attending: boolean; guest_count: number;
  token: string; checked_in_at: string | null;
};
type Invite = { id: string; title: string; user_id: string };

type LastResult = {
  status: "ok" | "already" | "error";
  name?: string;
  message?: string;
  guest_count?: number;
  at?: string;
};

function CheckinPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Invite | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [scanning, setScanning] = useState(true);
  const [last, setLast] = useState<LastResult | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("invites").select("id,title,user_id").eq("id", id).maybeSingle()
      .then(({ data }) => setInv(data as Invite));
    refreshList();
    const ch = supabase.channel(`checkin:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps", filter: `invite_id=eq.${id}` },
        () => refreshList()).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function refreshList() {
    const { data } = await supabase.from("rsvps")
      .select("id,guest_name,attending,guest_count,token,checked_in_at")
      .eq("invite_id", id).eq("attending", true)
      .order("guest_name");
    setRsvps((data ?? []) as Rsvp[]);
  }

  async function doCheckIn(token: string) {
    if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("check_in_rsvp", { _token: token });
    setBusy(false);
    if (error) {
      setLast({ status: "error", message: error.message });
      toast.error(error.message);
      return;
    }
    const row = (Array.isArray(data) ? data[0] : null) as
      | { guest_name: string; guest_count: number; checked_in_at: string; already: boolean; invite_id: string }
      | null;
    if (!row) return;
    if (row.invite_id !== id) {
      setLast({ status: "error", message: "QR de outro evento" });
      toast.error("Esse QR não é deste evento");
      return;
    }
    setLast({
      status: row.already ? "already" : "ok",
      name: row.guest_name,
      guest_count: row.guest_count,
      at: row.checked_in_at,
    });
    if (row.already) toast.message(`${row.guest_name} já estava no evento`);
    else toast.success(`Bem-vindo(a), ${row.guest_name}!`);
    refreshList();
  }

  function handleScanResult(detected: { rawValue: string }[]) {
    const raw = detected[0]?.rawValue;
    if (!raw) return;
    // Accept either /rsvp/<token> URL or raw token
    const m = raw.match(/\/rsvp\/([a-f0-9]+)/i);
    const token = m ? m[1] : raw.trim();
    doCheckIn(token);
  }

  const filtered = useMemo(() =>
    rsvps.filter((r) => !search || r.guest_name.toLowerCase().includes(search.toLowerCase())),
    [rsvps, search]);

  const stats = useMemo(() => {
    const checked = rsvps.filter((r) => r.checked_in_at).length;
    const totalGuests = rsvps.reduce((a, r) => a + r.guest_count, 0);
    const checkedGuests = rsvps.filter((r) => r.checked_in_at).reduce((a, r) => a + r.guest_count, 0);
    return { checked, total: rsvps.length, checkedGuests, totalGuests };
  }, [rsvps]);

  if (loading || !inv) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/painel/$id" params={{ id }}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao painel</Link>
      </Button>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Check-in</h1>
        <p className="text-sm text-muted-foreground">{inv.title}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Confirmados" value={stats.total} />
        <Stat label="Pessoas esperadas" value={stats.totalGuests} />
        <Stat label="Check-ins" value={stats.checked} accent />
        <Stat label="Pessoas no evento" value={stats.checkedGuests} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* SCANNER */}
        <div className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Scanner</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => setScanning((s) => !s)}>
              {scanning ? "Pausar" : "Retomar"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-black aspect-square">
            {scanning ? (
              <Scanner
                onScan={handleScanResult}
                onError={(e) => console.error(e)}
                constraints={{ facingMode: "environment" }}
                styles={{ container: { width: "100%", height: "100%" } }}
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-white/60">Scanner pausado</div>
            )}
          </div>

          {last && (
            <div className={`mt-4 animate-fade-in rounded-2xl border p-4 ${
              last.status === "ok" ? "border-primary/40 bg-primary/10" :
              last.status === "already" ? "border-yellow-500/40 bg-yellow-500/10" :
              "border-destructive/40 bg-destructive/10"
            }`}>
              <div className="flex items-start gap-3">
                {last.status === "error"
                  ? <XCircle className="h-6 w-6 text-destructive" />
                  : <CheckCircle2 className={`h-6 w-6 ${last.status === "ok" ? "text-primary" : "text-yellow-500"}`} />}
                <div className="flex-1">
                  {last.status === "error" ? (
                    <>
                      <p className="font-medium text-destructive">Não foi possível validar</p>
                      <p className="text-xs text-muted-foreground">{last.message}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-lg font-semibold">{last.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {last.status === "already" ? "Já havia feito check-in" : "Check-in realizado"}
                        {last.guest_count ? ` · ${last.guest_count} pessoa${last.guest_count > 1 ? "s" : ""}` : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MANUAL LIST */}
        <div className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Lista de presença</h2>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar convidado…" />
            <Button size="icon" variant="ghost" onClick={refreshList} aria-label="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <ul className="max-h-[480px] divide-y divide-white/5 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">Nenhum confirmado.</li>
            )}
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.guest_name}</p>
                  <p className="text-xs text-muted-foreground">{r.guest_count} pessoa{r.guest_count > 1 ? "s" : ""}</p>
                </div>
                {r.checked_in_at ? (
                  <Badge className="bg-primary/20 text-primary">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Presente
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => doCheckIn(r.token)}>
                    Marcar presença
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 ${accent ? "ring-1 ring-primary/40" : ""}`}>
      <div className="font-display text-2xl font-semibold tabular-nums">{value.toLocaleString("pt-BR")}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
