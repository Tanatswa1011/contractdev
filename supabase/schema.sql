create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_workspace(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role in ('admin', 'member')
  );
$$;

create or replace function public.is_contract_member(target_contract uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contracts c
    join public.workspace_members wm on wm.workspace_id = c.workspace_id
    where c.id = target_contract
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_contract(target_contract uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contracts c
    join public.workspace_members wm on wm.workspace_id = c.workspace_id
    where c.id = target_contract
      and wm.user_id = auth.uid()
      and wm.role in ('admin', 'member')
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  display_name text,
  role text not null check (role in ('admin', 'member', 'viewer')),
  status text not null check (status in ('active', 'invited')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  notification_preferences jsonb not null default '{}'::jsonb,
  ai_settings jsonb not null default '{}'::jsonb,
  integrations jsonb not null default '{}'::jsonb,
  billing_snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  vendor text not null,
  contract_type text,
  owner_label text,
  status text not null check (status in ('active', 'expired', 'pending', 'draft', 'archived')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  risk_score integer not null default 0,
  health_label text,
  contract_value numeric(12,2) not null default 0,
  value_period text not null check (value_period in ('month', 'year', 'total')),
  renewal_type text not null check (renewal_type in ('auto-renewal', 'manual-renewal', 'evergreen', 'fixed-term')),
  start_date date not null,
  end_date date,
  renewal_date date,
  notice_period_days integer not null default 30,
  next_deadline date not null,
  summary text default '',
  ai_summary text default '',
  clauses text[] not null default '{}'::text[],
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, slug)
);

create table if not exists public.contract_files (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  storage_path text not null unique,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  version_number integer not null default 1,
  is_current boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contract_timeline_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  type text not null check (type in ('start', 'end', 'renewal', 'notice-window-open', 'notice-deadline')),
  label text not null,
  event_date date not null,
  is_critical boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contract_activities (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  description text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contract_reminders (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  remind_on timestamptz not null,
  channel text not null check (channel in ('email', 'in_app')),
  note text,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists workspace_members_workspace_user_idx
  on public.workspace_members (workspace_id, user_id)
  where user_id is not null;

create unique index if not exists workspace_members_workspace_email_idx
  on public.workspace_members (workspace_id, email);

create index if not exists contracts_workspace_next_deadline_idx
  on public.contracts (workspace_id, next_deadline);

create index if not exists contracts_workspace_status_idx
  on public.contracts (workspace_id, status);

create index if not exists contract_files_contract_current_idx
  on public.contract_files (contract_id, is_current);

create index if not exists contract_timeline_contract_date_idx
  on public.contract_timeline_events (contract_id, event_date);

create index if not exists contract_activities_contract_created_idx
  on public.contract_activities (contract_id, created_at desc);

create index if not exists contract_reminders_contract_created_idx
  on public.contract_reminders (contract_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row
execute function public.set_updated_at();

drop trigger if exists workspace_settings_set_updated_at on public.workspace_settings;
create trigger workspace_settings_set_updated_at
before update on public.workspace_settings
for each row
execute function public.set_updated_at();

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
before update on public.contracts
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_files enable row level security;
alter table public.contract_timeline_events enable row level security;
alter table public.contract_activities enable row level security;
alter table public.contract_reminders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
on public.workspaces
for insert
with check (auth.uid() = created_by);

drop policy if exists "workspaces_update_manager" on public.workspaces;
create policy "workspaces_update_manager"
on public.workspaces
for update
using (public.can_manage_workspace(id))
with check (public.can_manage_workspace(id));

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_insert_self_or_manager" on public.workspace_members;
create policy "workspace_members_insert_self_or_manager"
on public.workspace_members
for insert
with check (
  user_id = auth.uid()
  or public.can_manage_workspace(workspace_id)
);

drop policy if exists "workspace_members_update_manager" on public.workspace_members;
create policy "workspace_members_update_manager"
on public.workspace_members
for update
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "workspace_members_delete_manager" on public.workspace_members;
create policy "workspace_members_delete_manager"
on public.workspace_members
for delete
using (public.can_manage_workspace(workspace_id));

drop policy if exists "workspace_settings_select_member" on public.workspace_settings;
create policy "workspace_settings_select_member"
on public.workspace_settings
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_settings_insert_manager" on public.workspace_settings;
create policy "workspace_settings_insert_manager"
on public.workspace_settings
for insert
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "workspace_settings_update_manager" on public.workspace_settings;
create policy "workspace_settings_update_manager"
on public.workspace_settings
for update
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "contracts_select_member" on public.contracts;
create policy "contracts_select_member"
on public.contracts
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "contracts_insert_manager" on public.contracts;
create policy "contracts_insert_manager"
on public.contracts
for insert
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "contracts_update_manager" on public.contracts;
create policy "contracts_update_manager"
on public.contracts
for update
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "contracts_delete_manager" on public.contracts;
create policy "contracts_delete_manager"
on public.contracts
for delete
using (public.can_manage_workspace(workspace_id));

drop policy if exists "contract_files_select_member" on public.contract_files;
create policy "contract_files_select_member"
on public.contract_files
for select
using (public.is_contract_member(contract_id));

drop policy if exists "contract_files_insert_manager" on public.contract_files;
create policy "contract_files_insert_manager"
on public.contract_files
for insert
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_files_update_manager" on public.contract_files;
create policy "contract_files_update_manager"
on public.contract_files
for update
using (public.can_manage_contract(contract_id))
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_files_delete_manager" on public.contract_files;
create policy "contract_files_delete_manager"
on public.contract_files
for delete
using (public.can_manage_contract(contract_id));

drop policy if exists "contract_timeline_select_member" on public.contract_timeline_events;
create policy "contract_timeline_select_member"
on public.contract_timeline_events
for select
using (public.is_contract_member(contract_id));

drop policy if exists "contract_timeline_insert_manager" on public.contract_timeline_events;
create policy "contract_timeline_insert_manager"
on public.contract_timeline_events
for insert
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_timeline_update_manager" on public.contract_timeline_events;
create policy "contract_timeline_update_manager"
on public.contract_timeline_events
for update
using (public.can_manage_contract(contract_id))
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_timeline_delete_manager" on public.contract_timeline_events;
create policy "contract_timeline_delete_manager"
on public.contract_timeline_events
for delete
using (public.can_manage_contract(contract_id));

drop policy if exists "contract_activities_select_member" on public.contract_activities;
create policy "contract_activities_select_member"
on public.contract_activities
for select
using (public.is_contract_member(contract_id));

drop policy if exists "contract_activities_insert_manager" on public.contract_activities;
create policy "contract_activities_insert_manager"
on public.contract_activities
for insert
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_activities_delete_manager" on public.contract_activities;
create policy "contract_activities_delete_manager"
on public.contract_activities
for delete
using (public.can_manage_contract(contract_id));

drop policy if exists "contract_reminders_select_member" on public.contract_reminders;
create policy "contract_reminders_select_member"
on public.contract_reminders
for select
using (public.is_contract_member(contract_id));

drop policy if exists "contract_reminders_insert_manager" on public.contract_reminders;
create policy "contract_reminders_insert_manager"
on public.contract_reminders
for insert
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_reminders_update_manager" on public.contract_reminders;
create policy "contract_reminders_update_manager"
on public.contract_reminders
for update
using (public.can_manage_contract(contract_id))
with check (public.can_manage_contract(contract_id));

drop policy if exists "contract_reminders_delete_manager" on public.contract_reminders;
create policy "contract_reminders_delete_manager"
on public.contract_reminders
for delete
using (public.can_manage_contract(contract_id));

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "contracts_member_read" on storage.objects;
create policy "contracts_member_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'contracts'
  and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "contracts_manager_insert" on storage.objects;
create policy "contracts_manager_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'contracts'
  and public.can_manage_workspace(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "contracts_manager_update" on storage.objects;
create policy "contracts_manager_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'contracts'
  and public.can_manage_workspace(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'contracts'
  and public.can_manage_workspace(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "contracts_manager_delete" on storage.objects;
create policy "contracts_manager_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'contracts'
  and public.can_manage_workspace(((storage.foldername(name))[1])::uuid)
);
