-- ============================================================
-- Migration: 001_initial_schema
-- Creates: profiles, organizations, organization_members
-- Enables RLS and defines all row-level security policies
-- Adds trigger to auto-create profile on auth.users insert
-- ============================================================

-- -------------------------
-- TABLE: profiles
-- -------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- TABLE: organizations
-- -------------------------
CREATE TABLE public.organizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL CHECK (char_length(name) >= 2),
  type                 TEXT NOT NULL CHECK (type IN ('school', 'nonprofit', 'business', 'government', 'startup')),
  created_by           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_district      TEXT,
  nonprofit_ein        TEXT,
  business_reg_number  TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- TABLE: organization_members
-- -------------------------
CREATE TABLE public.organization_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active')),
  role             TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_at       TIMESTAMPTZ DEFAULT now(),
  joined_at        TIMESTAMPTZ,
  UNIQUE (organization_id, email)
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: organizations
-- ============================================================
CREATE POLICY "Admins can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND is_admin = true
    )
  );

CREATE POLICY "Admins can view own organizations"
  ON public.organizations
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update own organizations"
  ON public.organizations
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete own organizations"
  ON public.organizations
  FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================
-- RLS POLICIES: organization_members
-- ============================================================
CREATE POLICY "Org admin can view members"
  ON public.organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "Org admin can insert members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "Org admin can update members"
  ON public.organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND created_by = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: auto-create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
