-- ContractGuardAI minimal schema for current UI flows
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  workspace_name text not null default 'ContractGuardAI',
  notification_channels jsonb not null default '{}'::jsonb,
  notification_events jsonb not null default '{}'::jsonb,
  ai_settings jsonb not null default '{}'::jsonb,
  integrations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Member',
  status text not null default 'Invited',
  date_added timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists workspace_members_owner_id_idx on public.workspace_members(owner_id);
create index if not exists workspace_members_email_idx on public.workspace_members(email);

create table if not exists public.contracts (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vendor text not null,
  status text not null check (status in ('active', 'expired', 'pending', 'draft')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  risk_score int not null check (risk_score between 0 and 100),
  health_label text not null,
  contract_value numeric(14,2) not null default 0,
  value_period text not null check (value_period in ('month', 'year', 'total')),
  renewal_type text not null check (renewal_type in ('auto-renewal', 'manual-renewal', 'evergreen', 'fixed-term')),
  start_date timestamptz not null,
  end_date timestamptz,
  renewal_date timestamptz,
  notice_period_days int not null default 30,
  next_deadline timestamptz not null,
  summary text not null default '',
  ai_summary text not null default '',
  clauses jsonb not null default '[]'::jsonb,
  timeline_events jsonb not null default '[]'::jsonb,
  recent_activities jsonb not null default '[]'::jsonb,
  contract_type text,
  owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contracts_owner_id_idx on public.contracts(owner_id);
create index if not exists contracts_next_deadline_idx on public.contracts(next_deadline);
create index if not exists contracts_status_idx on public.contracts(status);
create index if not exists contracts_risk_level_idx on public.contracts(risk_level);

create table if not exists public.contract_files (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references public.contracts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size bigint,
  file_type text,
  storage_path text,
  file_url text,
  created_at timestamptz not null default now()
);
create index if not exists contract_files_contract_id_idx on public.contract_files(contract_id);
create index if not exists contract_files_owner_id_idx on public.contract_files(owner_id);

create table if not exists public.contract_reminders (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references public.contracts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
create index if not exists contract_reminders_contract_id_idx on public.contract_reminders(contract_id);
create index if not exists contract_reminders_due_at_idx on public.contract_reminders(due_at);

drop trigger if exists workspace_settings_updated_at on public.workspace_settings;
create trigger workspace_settings_updated_at
before update on public.workspace_settings
for each row execute function public.set_updated_at();

drop trigger if exists contracts_updated_at on public.contracts;
create trigger contracts_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.workspace_members enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_files enable row level security;
alter table public.contract_reminders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "workspace_settings_owner_all" on public.workspace_settings;
create policy "workspace_settings_owner_all" on public.workspace_settings
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "workspace_members_owner_all" on public.workspace_members;
create policy "workspace_members_owner_all" on public.workspace_members
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "contracts_owner_all" on public.contracts;
create policy "contracts_owner_all" on public.contracts
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "contract_files_owner_all" on public.contract_files;
create policy "contract_files_owner_all" on public.contract_files
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "contract_reminders_owner_all" on public.contract_reminders;
create policy "contract_reminders_owner_all" on public.contract_reminders
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
