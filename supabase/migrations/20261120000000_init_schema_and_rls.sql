-- Migration: 20261120000000_init_schema_and_rls.sql
-- Description: Create multi-tenant schema with Row Level Security (RLS) for AI Review QR

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SHOP_OWNER', 'SHOP_STAFF', 'CUSTOMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shop_member_role AS ENUM ('OWNER', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'SHOP_OWNER' NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. SHOPS
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    business_category TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#4F46E5' NOT NULL,
    google_review_url TEXT NOT NULL,
    verified_business_facts JSONB DEFAULT '[]'::jsonb NOT NULL,
    default_language TEXT DEFAULT 'en' NOT NULL,
    default_ai_provider TEXT DEFAULT 'gemini' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);

-- 3. SHOP MEMBERS
CREATE TABLE IF NOT EXISTS public.shop_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role shop_member_role DEFAULT 'STAFF' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_shop_user UNIQUE (shop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_members_shop_id ON public.shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_user_id ON public.shop_members(user_id);

-- 4. QR CODES
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    public_token TEXT UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    qr_image_path TEXT,
    scan_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_shop_id ON public.qr_codes(shop_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON public.qr_codes(public_token);

-- 5. REVIEW SESSIONS
CREATE TABLE IF NOT EXISTS public.review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
    anonymous_session_id TEXT NOT NULL,
    language TEXT DEFAULT 'en' NOT NULL,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_sessions_shop_id ON public.review_sessions(shop_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_qr_code_id ON public.review_sessions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_anon_id ON public.review_sessions(anonymous_session_id);

-- 6. REVIEW DRAFTS
CREATE TABLE IF NOT EXISTS public.review_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.review_sessions(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_notes TEXT,
    generated_text TEXT NOT NULL,
    edited_text TEXT,
    provider TEXT NOT NULL,
    model TEXT,
    language TEXT DEFAULT 'en' NOT NULL,
    style TEXT DEFAULT 'natural' NOT NULL,
    is_copied BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_drafts_session_id ON public.review_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_review_drafts_shop_id ON public.review_drafts(shop_id);

-- 7. ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.review_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_shop_type ON public.analytics_events(shop_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- 8. AI USAGE LOGS
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.review_sessions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0 NOT NULL,
    output_tokens INTEGER DEFAULT 0 NOT NULL,
    estimated_cost NUMERIC(10, 6) DEFAULT 0.0 NOT NULL,
    status TEXT DEFAULT 'SUCCESS' NOT NULL,
    error_message TEXT,
    latency_ms INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_shop_id ON public.ai_usage_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);

-- 9. PLANS
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) DEFAULT 0.0 NOT NULL,
    max_qr_codes INTEGER DEFAULT 1 NOT NULL,
    max_monthly_ai_generations INTEGER DEFAULT 100 NOT NULL,
    allowed_ai_providers TEXT[] DEFAULT ARRAY['gemini', 'openai']::TEXT[] NOT NULL,
    custom_branding BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'ACTIVE' NOT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON public.subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);

-- 11. AI PROVIDER SETTINGS
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    default_model TEXT NOT NULL,
    available_models TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
    rpm_limit INTEGER DEFAULT 60 NOT NULL,
    tpm_limit INTEGER DEFAULT 100000 NOT NULL,
    is_fallback_enabled BOOLEAN DEFAULT true NOT NULL,
    fallback_priority INTEGER DEFAULT 1 NOT NULL,
    is_healthy BOOLEAN DEFAULT true NOT NULL,
    last_checked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_id ON public.audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR RLS
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_shop_access(check_shop_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin(user_id) THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.shops WHERE id = check_shop_id AND owner_id = user_id
    ) OR EXISTS (
        SELECT 1 FROM public.shop_members WHERE shop_id = check_shop_id AND user_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile or Super Admin can view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can update own profile or Super Admin can update all"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_super_admin(auth.uid()));

-- 2. Shops Policies
CREATE POLICY "Shop owners, members, and super admins can view shops"
    ON public.shops FOR SELECT
    USING (public.has_shop_access(id, auth.uid()));

CREATE POLICY "Shop owners and super admins can insert shops"
    ON public.shops FOR INSERT
    WITH CHECK (auth.uid() = owner_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Shop owners and super admins can update shops"
    ON public.shops FOR UPDATE
    USING (auth.uid() = owner_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Shop owners and super admins can delete shops"
    ON public.shops FOR DELETE
    USING (auth.uid() = owner_id OR public.is_super_admin(auth.uid()));

-- 3. Shop Members Policies
CREATE POLICY "Shop members can view other members of the same shop"
    ON public.shop_members FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()));

CREATE POLICY "Shop owners and super admins can manage members"
    ON public.shop_members FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.shops WHERE id = shop_members.shop_id AND owner_id = auth.uid())
        OR public.is_super_admin(auth.uid())
    );

-- 4. QR Codes Policies
CREATE POLICY "Shop members can view QR codes"
    ON public.qr_codes FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()) OR (is_active = true));

CREATE POLICY "Shop members can manage QR codes"
    ON public.qr_codes FOR ALL
    USING (public.has_shop_access(shop_id, auth.uid()));

-- 5. Review Sessions Policies
CREATE POLICY "Shop members can view review sessions"
    ON public.review_sessions FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()));

CREATE POLICY "Anyone can create review sessions"
    ON public.review_sessions FOR INSERT
    WITH CHECK (true);

-- 6. Review Drafts Policies
CREATE POLICY "Shop members can view review drafts"
    ON public.review_drafts FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()));

CREATE POLICY "Sessions can create review drafts"
    ON public.review_drafts FOR INSERT
    WITH CHECK (true);

-- 7. Analytics Events Policies
CREATE POLICY "Shop members can view analytics events"
    ON public.analytics_events FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()));

CREATE POLICY "Anyone can record analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

-- 8. AI Usage Logs Policies
CREATE POLICY "Shop members and super admin can view usage logs"
    ON public.ai_usage_logs FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- 9. Plans Policies
CREATE POLICY "Anyone can view active plans"
    ON public.plans FOR SELECT
    USING (is_active = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can modify plans"
    ON public.plans FOR ALL
    USING (public.is_super_admin(auth.uid()));

-- 10. Subscriptions Policies
CREATE POLICY "Shop members can view their subscription"
    ON public.subscriptions FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()));

CREATE POLICY "Only super admins can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.is_super_admin(auth.uid()));

-- 11. AI Provider Settings Policies
CREATE POLICY "Super admin can manage AI provider settings"
    ON public.ai_provider_settings FOR ALL
    USING (public.is_super_admin(auth.uid()));

-- 12. Audit Logs Policies
CREATE POLICY "Super admin can view all audit logs, owners can view shop logs"
    ON public.audit_logs FOR SELECT
    USING (
        public.is_super_admin(auth.uid()) 
        OR (shop_id IS NOT NULL AND public.has_shop_access(shop_id, auth.uid()))
    );

--------------------------------------------------------------------------------
-- AUTH HOOK TRIGGER FOR NEW USERS
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'SHOP_OWNER'::user_role)
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Default initial seed data for plans
INSERT INTO public.plans (name, code, description, price_monthly, max_qr_codes, max_monthly_ai_generations, allowed_ai_providers, custom_branding, is_active)
VALUES 
('Starter', 'starter', 'Essential AI Review QR for single store', 0.00, 1, 100, ARRAY['gemini', 'openai'], false, true),
('Pro', 'pro', 'For growing shops needing custom branding and higher AI limits', 29.00, 5, 1000, ARRAY['gemini', 'openai'], true, true),
('Enterprise', 'enterprise', 'Multi-location businesses with unlimited QR campaigns', 99.00, 50, 10000, ARRAY['gemini', 'openai'], true, true)
ON CONFLICT (code) DO NOTHING;

-- Default initial AI provider settings
INSERT INTO public.ai_provider_settings (provider, is_enabled, default_model, available_models, rpm_limit, tpm_limit, is_fallback_enabled, fallback_priority, is_healthy)
VALUES
('gemini', true, 'gemini-1.5-flash', ARRAY['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'], 120, 100000, true, 1, true),
('openai', true, 'gpt-4o-mini', ARRAY['gpt-4o-mini', 'gpt-4o'], 120, 100000, true, 2, true)
ON CONFLICT (provider) DO NOTHING;
