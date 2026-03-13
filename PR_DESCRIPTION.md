# Make Application Functionally Complete

**Create this PR at:** https://github.com/Tanatswa1011/contractdev/pull/new/cursor/core-product-functionality-5d8c

## Summary

This PR audits and fixes the ContractGuardAI codebase so every visible button, CTA, tab, and menu item performs a meaningful action. It adds authentication, a landing page, and wires the UI to Supabase where appropriate.

## What was changed

### New routes
- **`/`** – Marketing landing page (product title, description, Get started → /signup, Sign in → /login)
- **`/dashboard`** – Main dashboard (moved from `/`)
- **`/login`** – Email/password sign-in with Supabase Auth
- **`/signup`** – Email/password sign-up with Supabase Auth

### Routes/actions fixed

| Page | Action | Fix |
|------|--------|-----|
| Top nav | Logout | Calls `supabase.auth.signOut()`, redirects to `/` |
| Top nav | Dashboard, Contracts, Settings | Links updated to `/dashboard`, `/contracts`, `/settings` |
| Top nav | Sign up / Sign in | Shown on landing; links to auth pages |
| Contracts | Upload Contract | Opens file picker; uploads to Supabase storage (or graceful fallback) |
| Contracts | Filters | Dropdown with guidance |
| Contracts | Sort | Dropdown with Name, Renewal date, Risk score (asc/desc) |
| Contracts | Bulk Export | CSV download of selected contracts |
| Contracts | Bulk Send reminders | Handler with TODO for Supabase `contract_reminders` |
| Contracts | Bulk Assign owner | Prompt + feedback |
| Contracts | Bulk Archive | Client-side archive (hides from list) |
| Contract detail | Upload New Version | File input + Supabase storage |
| Contract detail | Create Reminder | Date prompt + feedback |
| Contract detail | Export | Text file download |
| Contract detail | Mark Reviewed | Toggles state |
| Contract detail | Maximize / Download | Handlers with feedback |
| Contract detail | Chat input | Submit handler with contract-aware responses |
| Settings | Workspace name | Persists to localStorage |
| Settings | Notification toggles | Persist to localStorage |
| Settings | AI Settings toggles/selects | Persist to localStorage |
| Settings | Members Export CSV | Exports mock members |
| Settings | Members Invite | Handler with TODO |
| Settings | Integrations Connect/Manage | Handlers with TODO |
| Settings | Billing buttons | Handlers (Upgrade, Manage, Add payment, Contact sales) |
| Settings | Danger Zone | Confirm dialog + TODO |

### Database entities (supabase/schema.sql)

- **workspaces** – Workspace name and metadata
- **workspace_members** – User–workspace membership (admin, member, viewer)
- **profiles** – User profile (extends auth.users)
- **workspace_settings** – Notification channels, AI settings (JSONB)
- **contracts** – Contract metadata (id, vendor, status, risk, dates, etc.)
- **contract_reminders** – Reminder records
- RLS policies for all tables
- Indexes on workspace_id, status, risk_level, renewal_date

## Assumptions

- Supabase project exists; user must paste `supabase/schema.sql` into SQL Editor
- Storage bucket `contracts` must be created for uploads
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Email confirmation in Supabase Auth can be enabled/disabled per project
- Billing (Stripe), OAuth integrations, and workspace CRUD are left as TODOs for future work

## What still needs manual setup

1. **Supabase project**: Create project at supabase.com
2. **Run schema**: Copy `supabase/schema.sql` into Supabase SQL Editor and execute
3. **Storage**: Create bucket `contracts` in Supabase Storage (optional; uploads fail gracefully if missing)
4. **Env vars**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

## Quality checks

- ✅ `npm run build` – passes
- ✅ `npx tsc --noEmit` – passes
- ✅ Main routes verified (/, /dashboard, /login, /signup, /contracts, /contracts/aws, /settings)
