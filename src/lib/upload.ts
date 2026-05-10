import { supabase } from "@/integrations/supabase/client";

export async function uploadInviteMedia(file: File, userId: string, inviteId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${inviteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("invite-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("invite-media").getPublicUrl(path);
  return data.publicUrl;
}
