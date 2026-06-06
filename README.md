# OrgDash

An admin portal for creating and managing organizations and their members. Admins can create organizations, invite members by email, and track invitation status — all behind a secure, role-gated authentication flow.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Edge Functions) |
| Styling | Tailwind CSS |
| Component library | shadcn/ui |
| Forms & validation | React Hook Form + Zod |
| Icons | Lucide React |

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd orgdash

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project credentials:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_INVITE_FUNCTION_URL=https://<your-project-ref>.supabase.co/functions/v1/invite-member
```

```bash
# 4. Start the dev server
npm run dev
```

## Database Migration

Run the migrations against your Supabase project using the Supabase CLI:

```bash
supabase db push
```

Or apply them manually by pasting the contents of `supabase/migrations/` into the Supabase dashboard SQL editor in order:

1. `001_initial_schema.sql` — creates tables, RLS policies, and the new-user trigger
2. `002_seed_admin.sql` — seeds the initial admin user

## Deploying the Edge Function

```bash
# Deploy the invite-member function
supabase functions deploy invite-member
```

The function requires these secrets (set automatically by Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — only receives merges from `development` for releases |
| `development` | Default integration branch — all feature PRs target this |
| `feat/*` | Feature branches cut from `development` |

**Workflow:**
1. Cut a branch from `development`: `git checkout -b feat/my-feature development`
2. Open a PR targeting `development`
3. After review and CI pass, merge into `development`
4. When ready to release, merge `development` → `main`

## Test Credentials

See submission email.

## What I'd Do With Another Day

- **Email delivery** — wire up Resend or Supabase's built-in email to actually send invitation emails with a magic link
- **Member management** — revoke invitations, change roles, remove members
- **Pagination** — cursor-based pagination for the members table as orgs grow
- **End-to-end tests** — Playwright tests covering the auth flow, org creation, and member invitation
- **Optimistic updates** — update the members list immediately on invite rather than waiting for the refetch
- **Organization settings** — edit org name/type, delete org with confirmation

## Tradeoffs

**Service role key in Edge Function vs. RLS-only approach**
The invite Edge Function uses the service role key so it can insert into `organization_members` while still manually enforcing the auth check. This keeps the RLS policies simple (read-only for the frontend anon key) at the cost of a slightly more privileged backend. The manual `created_by === caller.id` check replaces the RLS policy for inserts in this path.

**Inline error messages over error toasts for forms**
Form errors (e.g. "Already invited", "Invalid email") are shown inline inside the dialog rather than as toasts, so the user can see what's wrong without the dialog closing. Mutations that succeed show toasts. This two-pattern approach is intentional: inline for actionable validation, toast for transient confirmations.

**TanStack Query over SWR or raw fetch**
TanStack Query's `invalidateQueries` on mutation success keeps the members list fresh after an invite without any manual state management. The slightly heavier bundle is worth the cache coherence guarantees for a data-heavy admin UI.

**shadcn/ui over a full component library**
shadcn/ui ships only what you copy in — no tree-shaking needed, full Tailwind control, no version conflicts. The tradeoff is that complex components (data tables, date pickers) require more manual assembly.
