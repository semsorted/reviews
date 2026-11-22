-- Every business runs for one year from the day it was created, then its QR stops until renewed.
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ(3);

UPDATE public.shops
SET subscription_ends_at = created_at + INTERVAL '1 year'
WHERE subscription_ends_at IS NULL;

ALTER TABLE public.shops
    ALTER COLUMN subscription_ends_at SET DEFAULT (now() + INTERVAL '1 year'),
    ALTER COLUMN subscription_ends_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS shops_subscription_ends_at_idx ON public.shops (subscription_ends_at);
