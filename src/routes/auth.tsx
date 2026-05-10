import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — Convite BR" }] }),
});

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(6, "Mínimo 6 caracteres").max(72);
const nameSchema = z.string().trim().min(2, "Informe seu nome").max(80);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        toast.error("Não foi possível entrar com Google");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Erro ao entrar com Google");
    }
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!password.success) return toast.error(password.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password: password.data,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = nameSchema.safeParse(fd.get("name"));
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    if (!name.success) return toast.error(name.error.issues[0].message);
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!password.success) return toast.error(password.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.data },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse para criar e gerenciar convites</p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-elegant">
          <Button onClick={handleGoogle} variant="outline" className="w-full border-white/20 bg-white/5">
            Continuar com Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="pt-4">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="pt-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">E-mail</Label>
                  <Input id="email-up" name="email" type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password-up">Senha</Label>
                  <Input id="password-up" name="password" type="password" minLength={6} required />
                </div>
                <Button disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
