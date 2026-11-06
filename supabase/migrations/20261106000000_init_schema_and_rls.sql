-- ==============================================================================
-- Photographer Assistant (مساعد المصور) — Gate 4 Core Schema & RLS Policies
-- Database Engine: PostgreSQL 16+ (Supabase)
-- Security: OWASP ASVS 5.0.0 Level 2 compliant Row Level Security on ALL tables
-- ==============================================================================

-- 1. PROFILES TABLE (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    studio_name TEXT,
    default_currency CHAR(3) NOT NULL DEFAULT 'EGP' CHECK (default_currency IN ('EGP', 'USD', 'SAR', 'AED')),
    default_locale TEXT NOT NULL DEFAULT 'ar' CHECK (default_locale IN ('ar', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Secure Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, default_currency, default_locale)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        'EGP',
        'ar'
    );
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. CLIENTS TABLE (CRM)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_all_own" ON public.clients
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON public.clients(owner_id);

-- 3. PROJECTS TABLE (The Operational Backbone)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    project_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    currency CHAR(3) NOT NULL DEFAULT 'EGP' CHECK (currency IN ('EGP', 'USD', 'SAR', 'AED')),
    shoot_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_all_own" ON public.projects
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_projects_owner_status ON public.projects(owner_id, status);

-- 4. BRIEFS TABLE
CREATE TABLE IF NOT EXISTS public.briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    scope_description TEXT,
    requirements JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id)
);

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefs_all_own" ON public.briefs
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 5. QUOTES & QUOTE ITEMS (ProCost)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    currency CHAR(3) NOT NULL CHECK (currency IN ('EGP', 'USD', 'SAR', 'AED')),
    markup_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tax_amount_minor BIGINT NOT NULL DEFAULT 0,
    total_client_price_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id)
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_all_own" ON public.quotes
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('gear', 'crew', 'logistics', 'location', 'post_production', 'other')),
    quantity NUMERIC(6,2) NOT NULL DEFAULT 1.0,
    unit_cost_minor BIGINT NOT NULL CHECK (unit_cost_minor >= 0),
    total_price_minor BIGINT NOT NULL CHECK (total_price_minor >= 0),
    notes TEXT
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_items_all_own" ON public.quote_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_items.quote_id AND q.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_items.quote_id AND q.owner_id = auth.uid()
        )
    );

-- 6. SHOTLISTS, SHOTS & GEAR ITEMS
CREATE TABLE IF NOT EXISTS public.shotlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id)
);

ALTER TABLE public.shotlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shotlists_all_own" ON public.shotlists
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shotlist_id UUID NOT NULL REFERENCES public.shotlists(id) ON DELETE CASCADE,
    scene_number TEXT,
    shot_number TEXT,
    description TEXT NOT NULL,
    framing TEXT,
    lens TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0
);

ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shots_all_own" ON public.shots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.shotlists sl
            WHERE sl.id = shots.shotlist_id AND sl.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shotlists sl
            WHERE sl.id = shots.shotlist_id AND sl.owner_id = auth.uid()
        )
    );

-- 7. PALETTES TABLE (Cine Palette)
CREATE TABLE IF NOT EXISTS public.palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mood TEXT NOT NULL,
    dominant_color CHAR(7) NOT NULL,
    secondary_color CHAR(7) NOT NULL,
    accent_color CHAR(7) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "palettes_all_own" ON public.palettes
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 8. INVOICES & INVOICE ITEMS (Atomic Sequencing & Minor Units)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    currency CHAR(3) NOT NULL CHECK (currency IN ('EGP', 'USD', 'SAR', 'AED')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
    discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tax_amount_minor BIGINT NOT NULL DEFAULT 0,
    total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
    paid_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount_minor >= 0),
    balance_due_minor BIGINT NOT NULL CHECK (balance_due_minor >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'void')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Atomic Invariant: No duplicate invoice numbers per user
    CONSTRAINT unique_owner_invoice_number UNIQUE (owner_id, invoice_number)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_all_own" ON public.invoices
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(6,2) NOT NULL DEFAULT 1.0,
    unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
    total_price_minor BIGINT NOT NULL CHECK (total_price_minor >= 0)
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_all_own" ON public.invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invoices inv
            WHERE inv.id = invoice_items.invoice_id AND inv.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices inv
            WHERE inv.id = invoice_items.invoice_id AND inv.owner_id = auth.uid()
        )
    );

-- 9. PAYMENTS TABLE (Independent Milestone Payments & Idempotency)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL CHECK (currency IN ('EGP', 'USD', 'SAR', 'AED')),
    paid_at TIMESTAMPTZ NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'instapay', 'check', 'card', 'other')),
    idempotency_key TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Strict Invariant: Prevent double payments via idempotency key
    CONSTRAINT unique_owner_payment_idempotency UNIQUE (owner_id, idempotency_key)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_all_own" ON public.payments
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 10. INCOME LEDGER TABLE (Cash-basis Recognized Revenue)
CREATE TABLE IF NOT EXISTS public.income_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL CHECK (currency IN ('EGP', 'USD', 'SAR', 'AED')),
    recognized_at TIMESTAMPTZ NOT NULL,
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_owner_ledger_idempotency UNIQUE (owner_id, idempotency_key)
);

ALTER TABLE public.income_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_ledger_all_own" ON public.income_ledger
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 11. ASSETS TABLE (Equipment Catalog & Depreciation)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    purchase_cost_minor BIGINT NOT NULL CHECK (purchase_cost_minor > 0),
    currency CHAR(3) NOT NULL CHECK (currency IN ('EGP', 'USD', 'SAR', 'AED')),
    purchased_at DATE NOT NULL,
    expected_useful_hours INT NOT NULL CHECK (expected_useful_hours > 0),
    used_hours INT NOT NULL DEFAULT 0 CHECK (used_hours >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_all_own" ON public.assets
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 12. PUBLIC TOKENS TABLE (Cryptographic Shared Links)
CREATE TABLE IF NOT EXISTS public.public_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('brief', 'quote', 'booking', 'invoice')),
    resource_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    rate_limit_count INT NOT NULL DEFAULT 0,
    rate_limit_window_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.public_tokens ENABLE ROW LEVEL SECURITY;

-- Only owner can manage their public tokens.
CREATE POLICY "public_tokens_owner_manage" ON public.public_tokens
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_public_tokens_hash ON public.public_tokens(token_hash);
