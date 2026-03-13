-- ContractGuardAI - Supabase Schema
-- Copy-paste this into the Supabase SQL Editor to create required tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'ContractGuardAI',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members (links auth.users to workspaces)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  default_workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace settings (General, Notifications, AI Settings)
CREATE TABLE IF NOT EXISTS workspace_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  workspace_name TEXT,
  notification_channels JSONB DEFAULT '{"email": true, "inApp": true, "slack": false, "teams": false}'::jsonb,
  notification_items JSONB DEFAULT '{"expiring": true, "risk": true, "uploaded": true, "renewal": true, "clause": true}'::jsonb,
  ai_settings JSONB DEFAULT '{"autoAnalyze": false, "riskSensitivity": "medium", "clauseDepth": "standard"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'draft')),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_score INTEGER NOT NULL DEFAULT 0,
  health_label TEXT,
  contract_value NUMERIC NOT NULL DEFAULT 0,
  value_period TEXT NOT NULL DEFAULT 'year' CHECK (value_period IN ('month', 'year', 'total')),
  renewal_type TEXT NOT NULL DEFAULT 'auto-renewal' CHECK (renewal_type IN ('auto-renewal', 'manual-renewal', 'evergreen', 'fixed-term')),
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  notice_period_days INTEGER NOT NULL DEFAULT 30,
  next_deadline DATE NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  clauses TEXT[] DEFAULT '{}',
  file_path TEXT,
  owner TEXT,
  contract_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract reminders
CREATE TABLE IF NOT EXISTS contract_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  reminder_date TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'renewal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_workspace ON contracts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_risk_level ON contracts(risk_level);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON contracts(renewal_date);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);

-- RLS Policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_reminders ENABLE ROW LEVEL SECURITY;

-- Workspaces: members can read their workspaces
CREATE POLICY "workspaces_select" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT WITH CHECK (true);
CREATE POLICY "workspaces_update" ON workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Workspace members
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (user_id = auth.uid() OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Profiles: users can read/update own profile
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Workspace settings
CREATE POLICY "workspace_settings_select" ON workspace_settings
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_settings_insert" ON workspace_settings
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "workspace_settings_update" ON workspace_settings
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Contracts
CREATE POLICY "contracts_select" ON contracts
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "contracts_insert" ON contracts
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "contracts_update" ON contracts
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "contracts_delete" ON contracts
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Contract reminders
CREATE POLICY "contract_reminders_select" ON contract_reminders
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );
CREATE POLICY "contract_reminders_insert" ON contract_reminders
  FOR INSERT WITH CHECK (
    contract_id IN (SELECT id FROM contracts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );
CREATE POLICY "contract_reminders_delete" ON contract_reminders
  FOR DELETE USING (
    contract_id IN (SELECT id FROM contracts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );

-- Storage bucket for contract files (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);
