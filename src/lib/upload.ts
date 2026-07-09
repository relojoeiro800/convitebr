import { supabase } from "@/integrations/supabase/client";

// ~100 years in seconds — signed URL that effectively never expires,
// safe to persist as the shareable media URL for public invites.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 100;

export async function uploadInviteMedia(file: File, userId: string, inviteId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${inviteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("invite-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("invite-media")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("Falha ao gerar URL assinada");
  return data.signedUrl;
}
