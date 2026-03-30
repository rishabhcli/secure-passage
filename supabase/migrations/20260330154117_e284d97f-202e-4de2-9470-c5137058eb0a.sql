
-- Create app_users table
CREATE TABLE public.app_users (
  auth0_user_sub TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own record"
  ON public.app_users FOR SELECT
  USING (auth.uid()::text = auth0_user_sub);

CREATE POLICY "Users can insert their own record"
  ON public.app_users FOR INSERT
  WITH CHECK (auth.uid()::text = auth0_user_sub);

CREATE POLICY "Users can update their own record"
  ON public.app_users FOR UPDATE
  USING (auth.uid()::text = auth0_user_sub);

-- Service role needs full access for edge functions
CREATE POLICY "Service role full access on app_users"
  ON public.app_users FOR ALL
  USING (auth.role() = 'service_role');

-- Create crossings table
CREATE TABLE public.crossings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_user_sub TEXT NOT NULL,
  origin_type TEXT NOT NULL,
  companion_id TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  demo_scenario_key TEXT,
  
  source_kind TEXT NOT NULL,
  source_repo_owner TEXT NOT NULL,
  source_repo_name TEXT NOT NULL,
  source_issue_number INTEGER NOT NULL,
  source_issue_url TEXT,
  source_title TEXT,
  source_excerpt TEXT,
  source_labels JSONB,
  source_verified_at TIMESTAMPTZ,
  
  destination_kind TEXT NOT NULL,
  destination_channel_id TEXT NOT NULL,
  destination_channel_label TEXT NOT NULL,
  proposed_text TEXT NOT NULL,
  proposed_payload_hash TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'received',
  read_check_status TEXT NOT NULL DEFAULT 'pending',
  write_check_status TEXT NOT NULL DEFAULT 'awaiting_approval',
  
  policy_result TEXT NOT NULL DEFAULT 'pending',
  policy_reason_code TEXT,
  policy_reason_text TEXT,
  approved_by_sub TEXT,
  approved_at TIMESTAMPTZ,
  approved_payload_hash TEXT,
  
  slack_message_ts TEXT,
  slack_response_json JSONB,
  execution_error_code TEXT,
  execution_error_text TEXT,
  
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crossings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crossings"
  ON public.crossings FOR SELECT
  USING (auth.uid()::text = auth0_user_sub);

CREATE POLICY "Service role full access on crossings"
  ON public.crossings FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_crossings_user_created ON public.crossings (auth0_user_sub, created_at DESC);
CREATE INDEX idx_crossings_user_status ON public.crossings (auth0_user_sub, status, created_at DESC);

-- Create crossing_events table
CREATE TABLE public.crossing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crossing_id UUID NOT NULL REFERENCES public.crossings(id) ON DELETE CASCADE,
  auth0_user_sub TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  message TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crossing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crossing events"
  ON public.crossing_events FOR SELECT
  USING (auth.uid()::text = auth0_user_sub);

CREATE POLICY "Service role full access on crossing_events"
  ON public.crossing_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_crossing_events_crossing ON public.crossing_events (crossing_id, created_at ASC);

-- Create companion_heartbeats table
CREATE TABLE public.companion_heartbeats (
  companion_id TEXT NOT NULL,
  auth0_user_sub TEXT NOT NULL,
  origin_type TEXT NOT NULL,
  sandboxed BOOLEAN,
  version TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (companion_id, auth0_user_sub)
);

ALTER TABLE public.companion_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own heartbeats"
  ON public.companion_heartbeats FOR SELECT
  USING (auth.uid()::text = auth0_user_sub);

CREATE POLICY "Service role full access on companion_heartbeats"
  ON public.companion_heartbeats FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_heartbeats_user ON public.companion_heartbeats (auth0_user_sub, last_seen_at DESC);

-- Trigger to update crossings.updated_at
CREATE OR REPLACE FUNCTION public.update_crossings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_crossings_updated_at
  BEFORE UPDATE ON public.crossings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crossings_updated_at();
