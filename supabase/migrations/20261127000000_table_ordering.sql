-- Restaurants: QR table ordering, menus, tables, table bills, kitchen orders and staff logins.
-- Money is stored in whole paise. Every table is read and written only by the server.

CREATE TABLE IF NOT EXISTS public.ordering_settings (
    shop_id UUID PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    gstin TEXT CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
    gst_rate_bp INTEGER NOT NULL DEFAULT 0 CHECK (gst_rate_bp IN (0, 500, 1800)),
    fssai TEXT CHECK (fssai IS NULL OR fssai ~ '^[0-9]{14}$'),
    upi_url TEXT CHECK (upi_url IS NULL OR (upi_url LIKE 'upi://pay?%' AND char_length(upi_url) <= 500)),
    bill_fy SMALLINT NOT NULL DEFAULT 0,
    bill_seq INTEGER NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    -- GST can only be charged with a GSTIN.
    CONSTRAINT ordering_settings_gst_needs_gstin CHECK (gst_rate_bp = 0 OR gstin IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
    name_hi TEXT CHECK (name_hi IS NULL OR char_length(name_hi) <= 60),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS menu_categories_shop_idx ON public.menu_categories (shop_id, sort_order);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    name_hi TEXT CHECK (name_hi IS NULL OR char_length(name_hi) <= 80),
    price_paise INTEGER NOT NULL CHECK (price_paise BETWEEN 0 AND 10000000),
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS menu_items_shop_idx ON public.menu_items (shop_id, category_id, sort_order);

CREATE TABLE IF NOT EXISTS public.dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 20),
    public_token TEXT NOT NULL UNIQUE CHECK (char_length(public_token) BETWEEN 16 AND 64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    UNIQUE (shop_id, label)
);

-- One row per table visit. It holds the running tab and, once asked for, the bill.
CREATE TABLE IF NOT EXISTS public.table_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.dining_tables(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'BILL_REQUESTED', 'PAID', 'VOID')),
    party_size SMALLINT NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 1 AND 20),
    guest_name TEXT CHECK (guest_name IS NULL OR char_length(guest_name) <= 40),
    bill_fy SMALLINT,
    bill_no INTEGER,
    subtotal_paise INTEGER NOT NULL DEFAULT 0,
    cgst_paise INTEGER NOT NULL DEFAULT 0,
    sgst_paise INTEGER NOT NULL DEFAULT 0,
    round_off_paise INTEGER NOT NULL DEFAULT 0,
    total_paise INTEGER NOT NULL DEFAULT 0,
    gst_rate_bp INTEGER NOT NULL DEFAULT 0,
    paid_method TEXT CHECK (paid_method IS NULL OR paid_method IN ('UPI', 'CASH')),
    paid_at TIMESTAMPTZ(3),
    bill_requested_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    UNIQUE (shop_id, bill_fy, bill_no)
);
CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_one_open_per_table ON public.table_sessions (table_id) WHERE status IN ('OPEN', 'BILL_REQUESTED');
CREATE INDEX IF NOT EXISTS table_sessions_shop_idx ON public.table_sessions (shop_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PREPARING', 'SERVED', 'CANCELLED')),
    idempotency_key UUID NOT NULL UNIQUE,
    note TEXT CHECK (note IS NULL OR char_length(note) <= 140),
    served_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_shop_idx ON public.orders (shop_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_session_idx ON public.orders (session_id);

-- Name and price are copied, so later menu edits never change an old bill.
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price_paise INTEGER NOT NULL CHECK (price_paise BETWEEN 0 AND 10000000),
    is_veg BOOLEAN NOT NULL,
    qty SMALLINT NOT NULL CHECK (qty BETWEEN 1 AND 20)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);

-- One login per person working at the restaurant. Logins are an email, a mobile number or a username.
CREATE TABLE IF NOT EXISTS public.restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
    login TEXT NOT NULL UNIQUE CHECK (char_length(login) BETWEEN 3 AND 120 AND login = lower(login)),
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'KITCHEN', 'WAITER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_tries INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ(3),
    last_login_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS restaurant_staff_shop_idx ON public.restaurant_staff (shop_id, role);

-- Only a SHA-256 of the staff cookie is stored.
CREATE TABLE IF NOT EXISTS public.staff_sessions (
    id TEXT PRIMARY KEY CHECK (char_length(id) = 64),
    staff_id UUID NOT NULL REFERENCES public.restaurant_staff(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ(3) NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_sessions_staff_idx ON public.staff_sessions (staff_id);

ALTER TABLE public.ordering_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ordering_settings, public.menu_categories, public.menu_items, public.dining_tables,
    public.table_sessions, public.orders, public.order_items, public.restaurant_staff, public.staff_sessions FROM PUBLIC, anon, authenticated;
