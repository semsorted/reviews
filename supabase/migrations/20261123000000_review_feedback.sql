-- Low ratings and private customer messages for the admin "Needs attention" queue.
CREATE TABLE IF NOT EXISTS public.review_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES public.review_sessions(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating IN (1, 2)),
    message TEXT CHECK (char_length(message) <= 1000),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
    owner_note TEXT CHECK (char_length(owner_note) <= 1000),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS review_feedback_shop_status_created_idx
    ON public.review_feedback (shop_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS review_feedback_status_created_idx
    ON public.review_feedback (status, created_at DESC);

-- Only the app server reads this table. Public API roles get no access.
ALTER TABLE public.review_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.review_feedback FROM PUBLIC, anon, authenticated;
