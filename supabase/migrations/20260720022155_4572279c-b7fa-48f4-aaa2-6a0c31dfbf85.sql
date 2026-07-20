
-- applications table stores every submission from the 862 Academy landing page
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  class_key TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_ref TEXT,
  portone_payment_id TEXT UNIQUE,
  refund_requested_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applications_email_idx ON public.applications (lower(email));
CREATE INDEX applications_created_at_idx ON public.applications (created_at DESC);

-- Locked down: only service_role touches it. All access goes through server functions
-- with server-side email+password verification (public form, no auth users).
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_applications_updated_at();
