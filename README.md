# ContractGuardAI

Contract management SaaS — upload contracts, track renewals, monitor notice windows, and flag risk.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database + Auth**: Supabase (PostgreSQL, Row Level Security)
- **Storage**: Supabase Storage (PDF/contract files)
- **Styling**: Tailwind CSS
- **State**: Zustand

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and anon key from the [Supabase dashboard](https://supabase.com/dashboard).

### 3. Apply database schema

Open the [Supabase SQL editor](https://supabase.com/dashboard) and run the full contents of `supabase/schema.sql`.

This creates all tables, views, triggers (including auto workspace creation on signup), and RLS policies.

### 4. Create Supabase Storage bucket

In the Supabase dashboard → Storage → New bucket:
- Name: `contracts`
- Public: No (private)

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/dashboard` | Portfolio overview + KPI stats |
| `/contracts` | Contracts list + New Contract form |
| `/contracts/[id]` | Contract detail + file viewer + reminders |
| `/settings` | Workspace, notifications, members, integrations |
| `/forgot-password` | Password reset |

## Project structure

```
app/
  (auth)/         Auth pages (login, signup, forgot-password)
  (app)/          Protected app pages (dashboard, contracts, settings)
  page.tsx        Landing page
components/
  contracts/      ContractsPage, ContractDetailPage
  dashboard/      DashboardShell, StatsCards, etc.
  settings/       SettingsPage
  layout/         TopNav
  auth/           SessionGate
  ui/             Design system components
lib/
  supabase.ts               Browser client + exports
  supabase-server.ts        Server client (SSR)
  contracts-repository.ts   All contract data operations
  settings-repository.ts    All settings data operations
supabase/
  schema.sql      Full database schema (run this in Supabase SQL editor)
proxy.ts          Next.js 16 middleware (route protection)
types/
  contract.ts     TypeScript types
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `OPENAI_API_KEY` | Optional | For AI contract analysis (post-MVP) |
