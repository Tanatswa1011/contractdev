-- ============================================================
-- ContractGuardAI — Supabase Schema
-- ============================================================
-- Run this against your Supabase project in the SQL editor or
-- as a migration via the Supabase CLI:
--   supabase db push
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- Mirror of auth.users with extra application fields
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile + default workspace when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_workspace_id UUID;
  workspace_slug   TEXT;
  display_name     TEXT;
BEGIN
  display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Create profile
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    display_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Generate a URL-safe unique slug
  workspace_slug := lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g'))
                    || '-' || substring(gen_random_uuid()::text, 1, 8);

  -- Create the user's default workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (
    display_name || '''s Workspace',
    workspace_slug,
    NEW.id
  )
  RETURNING id INTO new_workspace_id;

  -- Add the user as the workspace owner in workspace_members
  INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
  VALUES (new_workspace_id, NEW.id, 'owner', NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- WORKSPACES
-- Organisational units — each user gets a default workspace
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        UNIQUE NOT NULL,
  owner_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan       TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL DEFAULT 'member'
                           CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at    TIMESTAMPTZ,
  UNIQUE (workspace_id, user_id)
);

-- ============================================================
-- CONTRACTS
-- Core entity
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID          NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name               TEXT          NOT NULL,
  vendor             TEXT          NOT NULL,
  status             TEXT          NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('active', 'expired', 'pending', 'draft')),
  risk_level         TEXT          NOT NULL DEFAULT 'low'
                                   CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_score         INTEGER       NOT NULL DEFAULT 0
                                   CHECK (risk_score >= 0 AND risk_score <= 100),
  health_label       TEXT,
  contract_value     NUMERIC(15,2),
  value_period       TEXT          CHECK (value_period IN ('month', 'year', 'total')),
  renewal_type       TEXT          CHECK (renewal_type IN (
                                     'auto-renewal', 'manual-renewal', 'evergreen', 'fixed-term'
                                   )),
  start_date         DATE,
  end_date           DATE,
  renewal_date       DATE,
  notice_period_days INTEGER       NOT NULL DEFAULT 30,
  next_deadline      DATE,
  summary            TEXT,
  ai_summary         TEXT,
  file_url           TEXT,
  created_by         UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  owner_id           UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  archived_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_workspace_idx  ON contracts(workspace_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx     ON contracts(status);
CREATE INDEX IF NOT EXISTS contracts_risk_level_idx ON contracts(risk_level);
CREATE INDEX IF NOT EXISTS contracts_end_date_idx   ON contracts(end_date);
CREATE INDEX IF NOT EXISTS contracts_owner_idx      ON contracts(owner_id);

-- ============================================================
-- CONTRACT CLAUSES
-- Extracted / AI-identified clauses within a contract
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_clauses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_type TEXT        NOT NULL CHECK (clause_type IN (
                            'Renewal', 'Termination', 'Liability',
                            'Data Processing', 'Confidentiality', 'SLA',
                            'Governing Law', 'Payment', 'Notice'
                          )),
  content     TEXT        NOT NULL,
  page_number INTEGER,
  confidence  NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clauses_contract_idx ON contract_clauses(contract_id);

-- ============================================================
-- TIMELINE EVENTS
-- Key dates on the contract lifecycle
-- ============================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL CHECK (event_type IN (
                            'start', 'end', 'renewal',
                            'notice-window-open', 'notice-deadline', 'custom'
                          )),
  event_date  DATE        NOT NULL,
  label       TEXT        NOT NULL,
  is_critical BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_contract_idx ON timeline_events(contract_id);
CREATE INDEX IF NOT EXISTS timeline_date_idx     ON timeline_events(event_date);

-- ============================================================
-- RECENT ACTIVITIES
-- Audit trail / activity feed for workspace events
-- ============================================================
CREATE TABLE IF NOT EXISTS recent_activities (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contract_id  UUID        REFERENCES contracts(id) ON DELETE SET NULL,
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type TEXT       NOT NULL,
  description  TEXT        NOT NULL,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_workspace_idx  ON recent_activities(workspace_id);
CREATE INDEX IF NOT EXISTS activities_contract_idx   ON recent_activities(contract_id);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON recent_activities(created_at DESC);

-- ============================================================
-- AI CHAT MESSAGES
-- Per-contract conversational AI Q&A history
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contract_id  UUID        REFERENCES contracts(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  role         TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content      TEXT        NOT NULL,
  tokens_used  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_contract_idx ON ai_chat_messages(contract_id);
CREATE INDEX IF NOT EXISTS chat_workspace_idx ON ai_chat_messages(workspace_id);

-- ============================================================
-- NOTIFICATIONS
-- In-app / email notification queue
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id  UUID        REFERENCES contracts(id) ON DELETE SET NULL,
  type         TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  body         TEXT,
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);

-- ============================================================
-- INTEGRATIONS
-- Third-party integration config per workspace
-- ============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider     TEXT        NOT NULL CHECK (provider IN (
                             'google_calendar', 'slack', 'zapier',
                             'webhook', 'teams', 'whatsapp'
                           )),
  config       JSONB       NOT NULL DEFAULT '{}',
  is_active    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, provider)
);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- Per-user notification settings
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_enabled         BOOLEAN     NOT NULL DEFAULT TRUE,
  in_app_enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
  slack_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,
  teams_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,
  renewal_reminder_days INTEGER[]   NOT NULL DEFAULT '{90, 60, 30, 14, 7}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, workspace_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces             ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Workspaces: members can view their workspace
CREATE POLICY "workspaces_select_member" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspaces_insert_owner" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces_update_owner" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "workspaces_delete_owner" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Workspace members: members can see their own memberships
CREATE POLICY "wm_select_member" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "wm_insert_admin" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "wm_delete_admin" ON workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Contracts: workspace members can view contracts in their workspace
CREATE POLICY "contracts_select_member" ON contracts
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_insert_member" ON contracts
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_update_member" ON contracts
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_delete_admin" ON contracts
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Contract clauses: inherit access from parent contract
CREATE POLICY "clauses_select" ON contract_clauses
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts)
  );

CREATE POLICY "clauses_insert" ON contract_clauses
  FOR INSERT WITH CHECK (
    contract_id IN (SELECT id FROM contracts)
  );

CREATE POLICY "clauses_delete" ON contract_clauses
  FOR DELETE USING (
    contract_id IN (SELECT id FROM contracts)
  );

-- Timeline events: inherit access from parent contract
CREATE POLICY "timeline_select" ON timeline_events
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts)
  );

CREATE POLICY "timeline_insert" ON timeline_events
  FOR INSERT WITH CHECK (
    contract_id IN (SELECT id FROM contracts)
  );

-- Recent activities: workspace members
CREATE POLICY "activities_select" ON recent_activities
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "activities_insert" ON recent_activities
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- AI chat messages: workspace members
CREATE POLICY "chat_select" ON ai_chat_messages
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_insert" ON ai_chat_messages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Notifications: only the target user
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Integrations: workspace members can view, admins can modify
CREATE POLICY "integrations_select" ON integrations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "integrations_upsert_admin" ON integrations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Notification preferences: own record only
CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_workspaces
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_contracts
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_integrations
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_notif_prefs
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================

-- Contracts with expiry days remaining (useful for dashboard queries)
CREATE OR REPLACE VIEW contracts_with_urgency AS
SELECT
  c.*,
  CASE
    WHEN c.end_date IS NULL THEN NULL
    ELSE (c.end_date - CURRENT_DATE)
  END AS days_until_expiry,
  CASE
    WHEN c.renewal_date IS NOT NULL THEN (c.renewal_date - CURRENT_DATE)
    ELSE NULL
  END AS days_until_renewal,
  CASE
    WHEN c.end_date IS NOT NULL AND (c.end_date - CURRENT_DATE) <= c.notice_period_days THEN TRUE
    ELSE FALSE
  END AS in_notice_window
FROM contracts c
WHERE c.archived_at IS NULL;

-- Workspace summary stats
CREATE OR REPLACE VIEW workspace_contract_stats AS
SELECT
  workspace_id,
  COUNT(*)                                              AS total_contracts,
  COUNT(*) FILTER (WHERE status = 'active')             AS active_contracts,
  COUNT(*) FILTER (WHERE risk_level = 'high')           AS high_risk_contracts,
  COUNT(*) FILTER (
    WHERE end_date IS NOT NULL
    AND (end_date - CURRENT_DATE) <= 30
    AND status = 'active'
  )                                                     AS renewing_in_30_days,
  ROUND(AVG(risk_score))                                AS avg_risk_score
FROM contracts
WHERE archived_at IS NULL
GROUP BY workspace_id;

-- ============================================================
-- WORKSPACE SETTINGS
-- Per-user workspace configuration (one row per user for MVP)
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_settings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_name        TEXT,
  notification_channels JSONB       NOT NULL DEFAULT '{}',
  notification_events   JSONB       NOT NULL DEFAULT '{}',
  ai_settings           JSONB       NOT NULL DEFAULT '{}',
  integrations          JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS ws_settings_user_idx ON workspace_settings(user_id);

ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_settings_own" ON workspace_settings
  FOR ALL USING (user_id = auth.uid());

CREATE TRIGGER set_updated_at_ws_settings
  BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CONTRACT REMINDERS
-- Per-contract reminder records
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_reminders (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  due_at      TIMESTAMPTZ NOT NULL,
  is_sent     BOOLEAN     NOT NULL DEFAULT FALSE,
  status      TEXT        NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reminders_contract_idx ON contract_reminders(contract_id);
CREATE INDEX IF NOT EXISTS reminders_user_idx     ON contract_reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_due_at_idx   ON contract_reminders(due_at);

ALTER TABLE contract_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_select" ON contract_reminders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "reminders_insert" ON contract_reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reminders_update" ON contract_reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "reminders_delete" ON contract_reminders
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- CONTRACT FILES
-- Uploaded file records per contract (supports versioning)
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_files (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name   TEXT        NOT NULL,
  file_url    TEXT,
  file_size   BIGINT,
  file_type   TEXT,
  version     INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS files_contract_idx ON contract_files(contract_id);
CREATE INDEX IF NOT EXISTS files_user_idx     ON contract_files(user_id);

ALTER TABLE contract_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select" ON contract_files
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts)
  );

CREATE POLICY "files_insert" ON contract_files
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "files_delete" ON contract_files
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- SUPABASE STORAGE
-- Run the following in the Supabase dashboard Storage section,
-- or via the Supabase CLI / REST API:
--
--   1. Create a private bucket named "contracts"
--   2. Apply the storage policies below
--
-- Storage bucket RLS (run in SQL editor after creating the bucket):
-- ============================================================

-- Allow authenticated users to upload files to their own workspace folder
-- INSERT policy: storage.objects for bucket "contracts"
-- WITH CHECK: (auth.uid()::text = (storage.foldername(name))[1])
-- (file paths should be: {user_id}/{contract_id}/{filename})

-- Allow authenticated users to read files they have access to
-- SELECT policy: storage.objects for bucket "contracts"
-- USING: auth.role() = 'authenticated'

-- NOTE: Apply these policies via the Supabase dashboard Storage > Policies UI,
-- or use the supabase CLI:
--   supabase storage create contracts --public false
