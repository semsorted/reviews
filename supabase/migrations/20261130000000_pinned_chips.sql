-- A pinned chip is shown every day. A business with more chips than fit rotates the rest daily.
ALTER TABLE public.review_chips ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
