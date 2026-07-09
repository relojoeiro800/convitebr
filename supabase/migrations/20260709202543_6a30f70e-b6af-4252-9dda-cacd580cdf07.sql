
-- Lock down EXECUTE on SECURITY DEFINER functions to explicit roles only
REVOKE EXECUTE ON FUNCTION public.get_rsvp_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rsvp_by_token(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_secret_santa_assignment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_secret_santa_assignment(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_invite_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_invite_view(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.check_in_rsvp(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_rsvp(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.draw_secret_santa(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draw_secret_santa(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_credit_request(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_credit_request(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_credit_on_publish() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_rsvp_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;

-- Explicit restrictive INSERT policy on user_roles to prevent self-role assignment
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop overly permissive storage SELECT policy that allows listing all files in invite-media bucket.
-- Public bucket URLs still serve files directly without a SELECT policy.
DROP POLICY IF EXISTS "Public read invite media" ON storage.objects;

-- Allow owners to list/read their own uploaded files (path is prefixed with their user id)
CREATE POLICY "Users read own invite media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invite-media'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
