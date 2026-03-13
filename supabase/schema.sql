-- ContractGuardAI — Supabase Schema
-- Copy-paste this into the Supabase SQL editor to create all required tables.
-- Requires: Supabase project with auth enabled (email/password sign-up).

-- ============================================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  role          text not null default 'admin',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. Workspace settings
-- ============================================================
create table if not exists public.workspace_settings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  workspace_name  text not null default 'ContractGuardAI',
  dark_mode       boolean not null default false,
  -- Notification preferences (JSON for flexibility)
  notifications   jsonb not null default '{
    "channels": {
      "email": true,
      "in_app": true,
      "slack": false,
      "teams": false
    },
    "events": {
      "expiring": true,
      "risk": true,
      "uploaded": true,
      "renewal": true,
      "clause": true
    }
  }'::jsonb,
  -- AI settings
  ai_settings     jsonb not null default '{
    "auto_analyze": false,
    "risk_sensitivity": "Medium",
    "clause_extraction": "Standard",
    "language_detection": "Auto-detect",
    "summary_style": "Concise",
    "secure_mode": false,
    "metadata_only": false,
    "retain_history": false
  }'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- 3. Contracts
-- ============================================================
create table if not exists public.contracts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  vendor            text not null,
  status            text not null default 'active'
                    check (status in ('active', 'expired', 'pending', 'draft')),
  risk_level        text not null default 'low'
                    check (risk_level in ('low', 'medium', 'high')),
  risk_score        integer not null default 0,
  health_label      text not null default 'Healthy',
  contract_value    numeric(12, 2) not null default 0,
  value_period      text not null default 'year'
                    check (value_period in ('month', 'year', 'total')),
  renewal_type      text not null default 'manual-renewal'
                    check (renewal_type in ('auto-renewal', 'manual-renewal', 'evergreen', 'fixed-term')),
  contract_type     text not null default 'SaaS Subscription',
  owner             text not null default 'Legal',
  start_date        timestamptz not null default now(),
  end_date          timestamptz,
  renewal_date      timestamptz,
  notice_period_days integer not null default 30,
  next_deadline     timestamptz not null default now(),
  summary           text not null default '',
  ai_summary        text not null default '',
  clauses           text[] not null default '{}',
  is_reviewed       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_contracts_user_id on public.contracts(user_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_risk_level on public.contracts(risk_level);

-- ============================================================
-- 4. Contract activities / timeline events
-- ============================================================
create table if not exists public.contract_activities (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references public.contracts(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  description   text not null,
  activity_type text not null default 'general',
  created_at    timestamptz not null default now()
);

create index if not exists idx_contract_activities_contract on public.contract_activities(contract_id);

-- ============================================================
-- 5. Contract timeline events
-- ============================================================
create table if not exists public.contract_timeline_events (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references public.contracts(id) on delete cascade,
  event_type    text not null
                check (event_type in ('start', 'end', 'renewal', 'notice-window-open', 'notice-deadline')),
  event_date    timestamptz not null,
  label         text not null,
  is_critical   boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_timeline_events_contract on public.contract_timeline_events(contract_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_activities enable row level security;
alter table public.contract_timeline_events enable row level security;

-- Profiles: users can read/update only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Workspace settings: users can CRUD only their own settings
create policy "Users can view own settings"
  on public.workspace_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.workspace_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.workspace_settings for update
  using (auth.uid() = user_id);

-- Contracts: users can CRUD only their own contracts
create policy "Users can view own contracts"
  on public.contracts for select
  using (auth.uid() = user_id);

create policy "Users can insert own contracts"
  on public.contracts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contracts"
  on public.contracts for update
  using (auth.uid() = user_id);

create policy "Users can delete own contracts"
  on public.contracts for delete
  using (auth.uid() = user_id);

-- Contract activities: scoped to user's contracts
create policy "Users can view own contract activities"
  on public.contract_activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own contract activities"
  on public.contract_activities for insert
  with check (auth.uid() = user_id);

-- Timeline events: scoped through contract ownership
create policy "Users can view own timeline events"
  on public.contract_timeline_events for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own timeline events"
  on public.contract_timeline_events for insert
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.user_id = auth.uid()
    )
  );
