import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Nova senha — Convite BR" }] }),
});

const passwordSchema = z.string().min(6, "Mínimo 6 caracteres").max(72);

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for Supabase to process recovery hash and set session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = passwordSchema.safeParse(fd.get("password"));
    const confirm = String(fd.get("confirm") || "");
    if (!password.success) return toast.error(password.error.issues[0].message);
    if (password.data !== confirm) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password.data });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
            <KeyRound className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold">Nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma senha forte para sua conta
          </p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-elegant">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">
              Validando link…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" name="confirm" type="password" minLength={6} required />
              </div>
              <Button
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground"
              >
                Salvar nova senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
