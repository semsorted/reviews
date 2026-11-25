-- The price a business paid for its QR, kept with the business so a later change in Settings never rewrites it.
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS qr_price INTEGER CHECK (qr_price BETWEEN 0 AND 1000000);

-- Businesses added before this existed paid the price in Settings at the time.
UPDATE public.shops
SET qr_price = COALESCE((SELECT normal_price FROM public.poster_pricing WHERE id = 1), 1999)
WHERE qr_price IS NULL;

-- A new business that is saved without a price gets today's Normal poster price, and keeps it.
CREATE OR REPLACE FUNCTION public.set_shop_qr_price() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.qr_price IS NULL THEN
        NEW.qr_price := COALESCE((SELECT normal_price FROM public.poster_pricing WHERE id = 1), 1999);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_set_qr_price ON public.shops;
CREATE TRIGGER shops_set_qr_price BEFORE INSERT ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_shop_qr_price();
