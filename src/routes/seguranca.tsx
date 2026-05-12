import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft, ShieldCheck, Lock, Database, FileDown, AlertTriangle,
  ScrollText, KeyRound, Bot, Cloud,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/seguranca")({
  component: SecurityPage,
  head: () => ({ meta: [
    { title: "Segurança e privacidade — Convite BR" },
    { name: "description", content: "Proteções, criptografia, backups, anti-spam e seus direitos LGPD." },
  ] }),
});

type Protection = {
  icon: typeof ShieldCheck;
  title: string;
  status: "ativo" | "automático" | "info";
  description: string;
};

const PROTECTIONS: Protection[] = [
  {
    icon: Lock, title: "Criptografia em trânsito e em repouso", status: "ativo",
    description: "Todas as conexões usam HTTPS/TLS e os dados em banco são criptografados com AES-256 no servidor.",
  },
  {
    icon: KeyRound, title: "Senhas com hash seguro", status: "ativo",
    description: "Senhas nunca são armazenadas em texto plano — usamos bcrypt com salt único por usuário.",
  },
  {
    icon: Database, title: "Row-Level Security (RLS)", status: "ativo",
    description: "Cada tabela tem políticas que garantem que você só acessa os seus próprios convites e confirmações.",
  },
  {
    icon: Cloud, title: "Backup automático diário", status: "automático",
    description: "Snapshots diários do banco com retenção de 7 dias para recuperação em caso de incidente.",
  },
  {
    icon: Bot, title: "Anti-spam em formulários públicos", status: "ativo",
    description: "Honeypot invisível e validação de tempo mínimo bloqueiam bots em RSVPs sem incomodar visitantes.",
  },
  {
    icon: ScrollText, title: "Logs de acesso administrativo", status: "ativo",
    description: "Ações sensíveis (login, alterações de plano, moderação) ficam registradas para auditoria.",
  },
];

function SecurityPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [lastSignInAt, setLastSignInAt] = useState<string | null>(null);

  const removeAccount = useServerFn(deleteMyAccount);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLastSignInAt(user.last_sign_in_at ?? null);
  }, [user]);

  async function exportData() {
    if (!user) return;
    setExporting(true);
    try {
      const [profile, invites, credits, payments, favs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("invites").select("*").eq("user_id", user.id),
        supabase.from("credits").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
        supabase.from("template_favorites").select("*").eq("user_id", user.id),
      ]);
      const inviteIds = (invites.data ?? []).map((i) => i.id);
      const rsvps = inviteIds.length
        ? (await supabase.from("rsvps").select("*").in("invite_id", inviteIds)).data ?? []
        : [];
      const payload = {
        exported_at: new Date().toISOString(),
        account: { id: user.id, email: user.email, created_at: user.created_at },
        profile: profile.data,
        invites: invites.data,
        rsvps,
        payments: payments.data,
        credits: credits.data,
        favorites: favs.data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-convite-br-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Seus dados foram exportados");
    } catch (e) {
      toast.error("Falha ao exportar dados");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "EXCLUIR") return toast.error('Digite "EXCLUIR" para confirmar');
    setDeleting(true);
    try {
      await removeAccount({});
      toast.success("Conta excluída. Até logo!");
      await supabase.auth.signOut();
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir conta");
      setDeleting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <main className="container max-w-5xl py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground">
        <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
      </Button>
      <div className="mb-8 flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold">Segurança e privacidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Como protegemos seus convites, dados e os de seus convidados — em conformidade com a LGPD.
          </p>
        </div>
      </div>

      {/* CONTA */}
      <section className="glass mb-6 rounded-3xl p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Sua conta</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</dt>
            <dd className="mt-1 text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Conta criada em</dt>
            <dd className="mt-1 text-sm">{new Date(user.created_at).toLocaleString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Último acesso</dt>
            <dd className="mt-1 text-sm">
              {lastSignInAt ? new Date(lastSignInAt).toLocaleString("pt-BR") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">E-mail confirmado</dt>
            <dd className="mt-1 text-sm">
              {user.email_confirmed_at ? (
                <Badge className="bg-primary/20 text-primary">Confirmado</Badge>
              ) : (
                <Badge variant="secondary">Pendente</Badge>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* PROTEÇÕES */}
      <section className="mb-6 grid gap-4 md:grid-cols-2">
        {PROTECTIONS.map((p) => (
          <div key={p.title} className="glass rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{p.title}</h3>
                  <Badge
                    variant="outline"
                    className={
                      p.status === "ativo"
                        ? "border-primary/40 text-primary"
                        : "border-white/15 text-muted-foreground"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* LGPD */}
      <section className="glass mb-6 rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Seus direitos LGPD</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Você tem o direito de acessar, exportar e excluir seus dados a qualquer momento.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button onClick={exportData} disabled={exporting} variant="outline" className="border-white/15 bg-white/5">
            <FileDown className="mr-2 h-4 w-4" />
            {exporting ? "Exportando…" : "Baixar todos os meus dados (JSON)"}
          </Button>
          <Button asChild variant="outline" className="border-white/15 bg-white/5">
            <Link to="/privacidade"><ScrollText className="mr-2 h-4 w-4" /> Ler política de privacidade</Link>
          </Button>
        </div>
      </section>

      {/* DANGER ZONE */}
      <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-destructive">Zona perigosa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Excluir sua conta remove permanentemente todos os seus convites, confirmações,
              pagamentos e dados pessoais. Esta ação não pode ser desfeita.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4">Excluir minha conta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta definitivamente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os seus convites, confirmações, pagamentos e perfil serão apagados.
                    Para confirmar, digite <strong>EXCLUIR</strong> abaixo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmação</Label>
                  <Input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXCLUIR" />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting || confirmText !== "EXCLUIR"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Excluindo…" : "Excluir definitivamente"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </main>
  );
}
