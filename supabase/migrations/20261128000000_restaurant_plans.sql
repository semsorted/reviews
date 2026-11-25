-- Restaurant plans and the payments Semsorted receives for them. Managed only from admin.
CREATE TABLE IF NOT EXISTS public.restaurant_plans (
    id TEXT PRIMARY KEY CHECK (id ~ '^[a-z]{3,20}$'),
    name TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    monthly_price INTEGER NOT NULL CHECK (monthly_price BETWEEN 1 AND 1000000),
    yearly_price INTEGER NOT NULL CHECK (yearly_price BETWEEN 1 AND 10000000),
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    months INTEGER NOT NULL CHECK (months IN (1, 12)),
    amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 10000000),
    method TEXT NOT NULL CHECK (method IN ('UPI', 'CASH', 'BANK')),
    reference TEXT CHECK (reference IS NULL OR char_length(reference) <= 40),
    idempotency_key UUID NOT NULL UNIQUE,
    period_from TIMESTAMPTZ(3) NOT NULL,
    period_to TIMESTAMPTZ(3) NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_payments_shop_idx ON public.shop_payments (shop_id, created_at DESC);

INSERT INTO public.restaurant_plans (id, name, summary, monthly_price, yearly_price, sort_order) VALUES
  ('cafe', 'Dhaba / Cafe', 'Table QR ordering, kitchen alerts, bill with UPI, sales report', 299, 2499, 1),
  ('restaurant', 'Restaurant / Hotel', 'Everything in Dhaba / Cafe, with GST bill, staff roles and waiting-time games', 699, 5999, 2)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.restaurant_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.restaurant_plans, public.shop_payments FROM PUBLIC, anon, authenticated;
