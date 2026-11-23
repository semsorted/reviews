-- Optional website branding for printed QR posters.
ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS website_url TEXT CHECK (website_url IS NULL OR (website_url LIKE 'https://%' AND char_length(website_url) <= 2048)),
    ADD COLUMN IF NOT EXISTS surface_color TEXT CHECK (surface_color IS NULL OR surface_color ~ '^#[0-9A-Fa-f]{6}$'),
    ADD COLUMN IF NOT EXISTS accent_color TEXT CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9A-Fa-f]{6}$');
