-- Adds admin-managed review chips and restricts all client-side writes.

CREATE TABLE IF NOT EXISTS public.review_chips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    label TEXT NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 40),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, label)
);

CREATE UNIQUE INDEX IF NOT EXISTS review_chips_shop_label_ci_key
    ON public.review_chips (shop_id, lower(label));
CREATE INDEX IF NOT EXISTS review_chips_shop_id_is_active_sort_order_idx
    ON public.review_chips (shop_id, is_active, sort_order);

ALTER TABLE public.review_chips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage review chips"
    ON public.review_chips FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = is_super_admin.user_id AND profiles.role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.has_shop_access(check_shop_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin(has_shop_access.user_id) THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.shops
        WHERE shops.id = has_shop_access.check_shop_id
          AND shops.owner_id = has_shop_access.user_id
    ) OR EXISTS (
        SELECT 1 FROM public.shop_members
        WHERE shop_members.shop_id = has_shop_access.check_shop_id
          AND shop_members.user_id = has_shop_access.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- New accounts never become admins. An admin role is set manually in the database.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'CUSTOMER'::public.user_role
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Public visitors use server routes only.
DROP POLICY IF EXISTS "Anyone can create review sessions" ON public.review_sessions;
DROP POLICY IF EXISTS "Sessions can create review drafts" ON public.review_drafts;
DROP POLICY IF EXISTS "Anyone can record analytics events" ON public.analytics_events;

-- Users must not be able to change their own role.
DROP POLICY IF EXISTS "Users can update own profile or Super Admin can update all" ON public.profiles;

-- Shop, member, and QR writes are admin-only.
DROP POLICY IF EXISTS "Shop owners and super admins can insert shops" ON public.shops;
DROP POLICY IF EXISTS "Shop owners and super admins can update shops" ON public.shops;
DROP POLICY IF EXISTS "Shop owners and super admins can delete shops" ON public.shops;
DROP POLICY IF EXISTS "Shop owners and super admins can manage members" ON public.shop_members;
DROP POLICY IF EXISTS "Shop members can view QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Shop members can manage QR codes" ON public.qr_codes;

CREATE POLICY "Super admins can manage shops"
    ON public.shops FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage members"
    ON public.shop_members FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Shop members can read their QR codes"
    ON public.qr_codes FOR SELECT
    USING (public.has_shop_access(shop_id, auth.uid()));

CREATE POLICY "Super admins can manage QR codes"
    ON public.qr_codes FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Deleting an auth user must never delete shops and their printed QR codes.
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_owner_id_fkey;
ALTER TABLE public.shops
    ADD CONSTRAINT shops_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
