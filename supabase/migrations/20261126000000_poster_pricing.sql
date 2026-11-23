-- Poster prices and coupons, managed only from admin Settings.
CREATE TABLE IF NOT EXISTS public.poster_pricing (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    normal_price INTEGER NOT NULL DEFAULT 1999 CHECK (normal_price BETWEEN 1 AND 1000000),
    custom_price INTEGER NOT NULL DEFAULT 2250 CHECK (custom_price BETWEEN 1 AND 1000000),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poster_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{3,20}$'),
    amount_off INTEGER NOT NULL CHECK (amount_off BETWEEN 1 AND 1000000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

INSERT INTO public.poster_pricing (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.poster_coupons (code, amount_off) VALUES ('SEM251', 251) ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.poster_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.poster_pricing, public.poster_coupons FROM PUBLIC, anon, authenticated;
