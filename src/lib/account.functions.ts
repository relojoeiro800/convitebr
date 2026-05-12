import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * LGPD: permite ao usuário excluir definitivamente sua conta e todos os dados.
 * Remove convites, RSVPs, pagamentos, perfil, papéis e a conta de auth.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId as string;

    // Apaga convites do usuário (cascateia RSVPs/sorteios via lógica do app).
    await supabaseAdmin.from("rsvps").delete().in(
      "invite_id",
      (await supabaseAdmin.from("invites").select("id").eq("user_id", userId)).data?.map((r) => r.id) ?? [],
    );
    await supabaseAdmin.from("invites").delete().eq("user_id", userId);
    await supabaseAdmin.from("payments").delete().eq("user_id", userId);
    await supabaseAdmin.from("credits").delete().eq("user_id", userId);
    await supabaseAdmin.from("credit_transactions").delete().eq("user_id", userId);
    await supabaseAdmin.from("template_favorites").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
