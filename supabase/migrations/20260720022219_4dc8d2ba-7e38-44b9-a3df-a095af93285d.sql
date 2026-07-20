
-- Explicit no-op policy: applications is service_role only.
-- All user-facing access goes through server functions that verify email+password.
CREATE POLICY "no direct client access"
ON public.applications
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
