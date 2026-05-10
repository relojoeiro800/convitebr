import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Share2, Edit3, Trash2, Eye, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { INVITE_TYPES, type InviteType, slugify, inviteTypeLabel, formatEventDate } from "@/lib/invites";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Meus convites — Convite BR" }] }),
});

type Invite = {
  id: string;
  slug: string;
  type: InviteType;
  title: string;
  event_date: string | null;
  published: boolean;
  created_at: string;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("invites")
      .select("id,slug,type,title,event_date,published,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setInvites((data ?? []) as Invite[]);
      });
  }, [user]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const type = String(fd.get("type") || "") as InviteType;
    if (!title || !type) return toast.error("Preencha tipo e título");
    setCreating(true);
    const slug = slugify(title);
    const { data, error } = await supabase
      .from("invites")
      .insert({ user_id: user.id, title, type, slug })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) return toast.error(error?.message || "Erro ao criar convite");
    setOpen(false);
    navigate({ to: "/editor/$id", params: { id: data.id } });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este convite?")) return;
    const { error } = await supabase.from("invites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setInvites((prev) => prev.filter((i) => i.id !== id));
    toast.success("Convite excluído");
  }

  async function handleShare(slug: string) {
    const url = `${window.location.origin}/convite/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">Meus convites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie, edite e compartilhe seus convites</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> Novo convite
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Novo convite</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo de evento</Label>
                <Select name="type" defaultValue="casamento">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVITE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" placeholder="Ex.: Casamento de Ana & João" required />
              </div>
              <DialogFooter>
                <Button disabled={creating} type="submit" className="bg-gradient-primary text-primary-foreground">
                  Criar e editar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {invites.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-muted-foreground">Você ainda não criou nenhum convite.</p>
          <Button onClick={() => setOpen(true)} className="mt-4 bg-gradient-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Criar o primeiro
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invites.map((inv) => (
            <div key={inv.id} className="glass group rounded-3xl p-5 transition hover:shadow-glow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    {inviteTypeLabel(inv.type)}
                  </Badge>
                  <h3 className="mt-3 font-display text-xl font-semibold leading-tight">{inv.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inv.event_date ? formatEventDate(inv.event_date) : "Data não definida"}
                  </p>
                </div>
                {inv.published ? (
                  <Badge className="bg-primary/20 text-primary">Publicado</Badge>
                ) : (
                  <Badge variant="secondary">Rascunho</Badge>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/5">
                  <Link to="/editor/$id" params={{ id: inv.id }}>
                    <Edit3 className="mr-1 h-3.5 w-3.5" /> Editar
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/5">
                  <Link to="/convite/$slug" params={{ slug: inv.slug }} target="_blank">
                    <Eye className="mr-1 h-3.5 w-3.5" /> Ver
                  </Link>
                </Button>
                {inv.published && (
                  <Button onClick={() => handleShare(inv.slug)} size="sm" variant="outline" className="border-white/15 bg-white/5">
                    <Share2 className="mr-1 h-3.5 w-3.5" /> Compartilhar
                  </Button>
                )}
                <Button onClick={() => handleDelete(inv.id)} size="sm" variant="ghost" className="ml-auto text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Quer compartilhar pelo WhatsApp? Use “Compartilhar” para copiar o link e cole na conversa{" "}
        <ExternalLink className="inline h-3 w-3" />
      </p>
    </main>
  );
}
