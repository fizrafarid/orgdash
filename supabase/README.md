# Supabase Setup

## 1. Running the migration

The migration lives in `supabase/migrations/001_initial_schema.sql`.

**Steps:**

1. Open your [Supabase project dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the entire contents of `001_initial_schema.sql` into the editor.
5. Click **Run** (or press `Ctrl+Enter`).

You should see a success message. The migration creates three tables (`profiles`, `organizations`, `organization_members`), enables Row Level Security on all of them, defines all policies, and installs the trigger that auto-creates a profile whenever a new user signs up.

---

## 2. Setting a user as admin after signing up

By default every new user gets `is_admin = false`. To promote a user:

1. Have the user sign up through the app first (the trigger creates their profile row automatically).
2. In your Supabase dashboard go to **Authentication → Users** and copy the user's UUID.
3. Open the **SQL Editor**, run:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE id = '<paste-user-uuid-here>';
```

4. Verify:

```sql
SELECT id, full_name, is_admin
FROM public.profiles
WHERE id = '<paste-user-uuid-here>';
```

Once `is_admin = true`, that user can create organizations via the app.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in your project credentials:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in **Project Settings → API** in the Supabase dashboard.
