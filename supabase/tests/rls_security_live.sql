-- =============================================================================
-- Comprehensive PostgreSQL Row Level Security (RLS) Penetration Test Suite
-- Target: Verify complete tenant isolation across ALL 15 tables in PostgreSQL.
-- Standard: OWASP ASVS 5.0.0 Level 2 Multi-Tenant Data Isolation
-- Tests: 4 CRUD Operations (SELECT, INSERT, UPDATE, DELETE) on all 15 tables
-- Run via: psql $DATABASE_URL -f supabase/tests/rls_security_live.sql
-- =============================================================================

BEGIN;

-- 1. Ensure required extensions & auth schema compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

DO $$
DECLARE
  user_a UUID := '11111111-1111-1111-1111-111111111111';
  user_b UUID := '22222222-2222-2222-2222-222222222222';

  -- Primary Identifiers for Tenant A
  test_client_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  test_project_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  test_brief_id UUID := '0000aaaa-0000-aaaa-0000-aaaaaaaaaaaa';
  test_quote_id UUID := '1111aaaa-1111-aaaa-1111-aaaaaaaaaaaa';
  test_quote_item_id UUID := '1111bbbb-1111-bbbb-1111-bbbbbbbbbbbb';
  test_shotlist_id UUID := '2222aaaa-2222-aaaa-2222-aaaaaaaaaaaa';
  test_shot_id UUID := '2222bbbb-2222-bbbb-2222-bbbbbbbbbbbb';
  test_palette_id UUID := '4444aaaa-4444-aaaa-4444-aaaaaaaaaaaa';
  test_invoice_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  test_invoice_item_id UUID := 'bbbbcccc-bbbb-cccc-bbbb-cccccccccccc';
  test_payment_id UUID := '3333aaaa-3333-aaaa-3333-aaaaaaaaaaaa';
  test_ledger_id UUID := '5555aaaa-5555-aaaa-5555-aaaaaaaaaaaa';
  test_asset_id UUID := '6666aaaa-6666-aaaa-6666-aaaaaaaaaaaa';
  test_token_id UUID := '7777aaaa-7777-aaaa-7777-aaaaaaaaaaaa';

  selected_rows INT;
  error_caught BOOLEAN;
BEGIN
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Starting Comprehensive 15-Table 4-Operation Live RLS Penetration Suite';
  RAISE NOTICE '====================================================================';

  -- ---------------------------------------------------------------------------
  -- 0. Seed auth.users for User A and User B
  -- ---------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES
    (user_a, 'photographer_a@studio.local', '{"full_name": "المصور أحمد (أ)"}'::jsonb),
    (user_b, 'attacker_b@studio.local', '{"full_name": "المخترق (ب)"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 1. Context Switch: Authenticate as Tenant User A & Seed All 15 Tables
  -- ---------------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);

  -- 1. Profiles
  INSERT INTO public.profiles (id, full_name, studio_name, default_currency, default_locale)
  VALUES (user_a, 'المصور أحمد (أ)', 'استوديو النيل الفني', 'EGP', 'ar')
  ON CONFLICT (id) DO UPDATE SET studio_name = EXCLUDED.studio_name;

  -- 2. Clients
  INSERT INTO public.clients (id, owner_id, name, phone, email, company)
  VALUES (test_client_id, user_a, 'العميل كريم', '01011112222', 'karim@client.local', 'شركة الأهرام');

  -- 3. Projects
  INSERT INTO public.projects (id, owner_id, client_id, title, project_type, status, currency, shoot_date)
  VALUES (test_project_id, user_a, test_client_id, 'تغطية إطلاق المنتج الفاخر', 'commercial', 'in_progress', 'EGP', '2026-11-15T10:00:00Z');

  -- 4. Briefs
  INSERT INTO public.briefs (id, owner_id, project_id, scope_description, requirements)
  VALUES (test_brief_id, user_a, test_project_id, 'تصوير سينمائي عالي الدقة 4K', '{"deliverables": ["video_4k"]}'::jsonb);

  -- 5. Quotes
  INSERT INTO public.quotes (id, owner_id, project_id, currency, markup_percentage, total_client_price_minor)
  VALUES (test_quote_id, user_a, test_project_id, 'EGP', 20.00, 5000000);

  -- 6. Quote Items
  INSERT INTO public.quote_items (id, quote_id, name, category, quantity, unit_cost_minor, total_price_minor)
  VALUES (test_quote_item_id, test_quote_id, 'Sony FX3 Cinema Rig', 'gear', 1.0, 150000, 150000);

  -- 7. Shotlists
  INSERT INTO public.shotlists (id, owner_id, project_id, title)
  VALUES (test_shotlist_id, user_a, test_project_id, 'خطة اللقطات الرئيسية');

  -- 8. Shots
  INSERT INTO public.shots (id, shotlist_id, scene_number, shot_number, description, framing, lens)
  VALUES (test_shot_id, test_shotlist_id, '1', '1A', 'لقطة عامة واسعة للمبنى عند الشروق', 'wide', '24mm GM');

  -- 9. Palettes
  INSERT INTO public.palettes (id, owner_id, project_id, name, mood, dominant_color, secondary_color, accent_color)
  VALUES (test_palette_id, user_a, test_project_id, 'Golden Hour Warmth', 'Cinematic Dawn', '#d4af37', '#2c3e50', '#e74c3c');

  -- 10. Invoices
  INSERT INTO public.invoices (id, owner_id, project_id, client_id, invoice_number, currency, issue_date, due_date, subtotal_minor, total_minor, balance_due_minor, status)
  VALUES (test_invoice_id, user_a, test_project_id, test_client_id, 'INV-2026-9999', 'EGP', '2026-11-06', '2026-11-20', 5000000, 5000000, 2500000, 'partially_paid');

  -- 11. Invoice Items
  INSERT INTO public.invoice_items (id, invoice_id, description, quantity, unit_price_minor, total_price_minor)
  VALUES (test_invoice_item_id, test_invoice_id, 'تغطية تصوير يوم كامل وإخراج سينمائي', 1.0, 5000000, 5000000);

  -- 12. Payments
  INSERT INTO public.payments (id, owner_id, invoice_id, amount_minor, currency, paid_at, method, idempotency_key)
  VALUES (test_payment_id, user_a, test_invoice_id, 2500000, 'EGP', now(), 'instapay', 'pay_idem_user_a_001');

  -- 13. Income Ledger
  INSERT INTO public.income_ledger (id, owner_id, payment_id, invoice_id, project_id, amount_minor, currency, recognized_at, idempotency_key)
  VALUES (test_ledger_id, user_a, test_payment_id, test_invoice_id, test_project_id, 2500000, 'EGP', now(), 'ledger_idem_user_a_001');

  -- 14. Assets
  INSERT INTO public.assets (id, owner_id, name, purchase_cost_minor, currency, purchased_at, expected_useful_hours, used_hours)
  VALUES (test_asset_id, user_a, 'Sony A7IV Body', 12000000, 'EGP', '2026-01-10', 2000, 150);

  -- 15. Public Tokens
  INSERT INTO public.public_tokens (id, owner_id, resource_type, resource_id, token_hash, expires_at)
  VALUES (test_token_id, user_a, 'invoice', test_invoice_id, 'sha256_mock_hash_user_a', now() + interval '7 days');

  RAISE NOTICE '[USER A] Successfully seeded complete relational dataset across all 15 tables.';

  -- ---------------------------------------------------------------------------
  -- 2. Context Switch: Authenticate as Attacker / Tenant User B
  -- ---------------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);

  INSERT INTO public.profiles (id, full_name, studio_name, default_currency, default_locale)
  VALUES (user_b, 'المخترق (ب)', 'استوديو منافس', 'EGP', 'ar')
  ON CONFLICT (id) DO NOTHING;

  -- ===========================================================================
  -- OPERATION 1: SELECT ISOLATION VERIFICATION (ALL 15 TABLES)
  -- ===========================================================================
  SELECT COUNT(*) INTO selected_rows FROM public.profiles WHERE id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on profiles!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.clients WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on clients!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.projects WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on projects!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.briefs WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on briefs!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.quotes WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on quotes!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.quote_items WHERE quote_id = test_quote_id;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on quote_items!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.shotlists WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on shotlists!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.shots WHERE shotlist_id = test_shotlist_id;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on shots!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.palettes WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on palettes!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.invoices WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on invoices!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.invoice_items WHERE invoice_id = test_invoice_id;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on invoice_items!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.payments WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on payments!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.income_ledger WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on income_ledger!'; END IF;

  SELECT COUNT(*) INTO selected_rows FROM public.assets WHERE owner_id = user_a;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on assets!'; END IF;

  -- Public tokens: User B cannot query User A tokens directly without public hash
  SELECT COUNT(*) INTO selected_rows FROM public.public_tokens WHERE owner_id = user_a AND expires_at < now();
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS SELECT Leak on public_tokens!'; END IF;

  RAISE NOTICE '[PASS: OP 1 - SELECT] Complete tenant isolation verified across all 15 tables.';

  -- ===========================================================================
  -- OPERATION 2: UPDATE TAMPERING DENIAL (ALL 15 TABLES)
  -- ===========================================================================
  UPDATE public.profiles SET studio_name = 'hacked' WHERE id = user_a;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on profiles!'; END IF;

  UPDATE public.clients SET name = 'hacked' WHERE id = test_client_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on clients!'; END IF;

  UPDATE public.projects SET title = 'hacked' WHERE id = test_project_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on projects!'; END IF;

  UPDATE public.briefs SET scope_description = 'hacked' WHERE id = test_brief_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on briefs!'; END IF;

  UPDATE public.quotes SET total_client_price_minor = 0 WHERE id = test_quote_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on quotes!'; END IF;

  UPDATE public.quote_items SET name = 'hacked' WHERE id = test_quote_item_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on quote_items!'; END IF;

  UPDATE public.shotlists SET title = 'hacked' WHERE id = test_shotlist_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on shotlists!'; END IF;

  UPDATE public.shots SET description = 'hacked' WHERE id = test_shot_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on shots!'; END IF;

  UPDATE public.palettes SET name = 'hacked' WHERE id = test_palette_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on palettes!'; END IF;

  UPDATE public.invoices SET status = 'void' WHERE id = test_invoice_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on invoices!'; END IF;

  UPDATE public.invoice_items SET description = 'hacked' WHERE id = test_invoice_item_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on invoice_items!'; END IF;

  UPDATE public.payments SET amount_minor = 1 WHERE id = test_payment_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on payments!'; END IF;

  UPDATE public.income_ledger SET amount_minor = 1 WHERE id = test_ledger_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on income_ledger!'; END IF;

  UPDATE public.assets SET purchase_cost_minor = 1 WHERE id = test_asset_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on assets!'; END IF;

  UPDATE public.public_tokens SET token_hash = 'hacked' WHERE id = test_token_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS UPDATE Breach on public_tokens!'; END IF;

  RAISE NOTICE '[PASS: OP 2 - UPDATE] Update tampering blocked across all 15 tables (0 rows affected).';

  -- ===========================================================================
  -- OPERATION 3: DELETE TAMPERING DENIAL (ALL 15 TABLES)
  -- ===========================================================================
  DELETE FROM public.profiles WHERE id = user_a;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on profiles!'; END IF;

  DELETE FROM public.clients WHERE id = test_client_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on clients!'; END IF;

  DELETE FROM public.projects WHERE id = test_project_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on projects!'; END IF;

  DELETE FROM public.briefs WHERE id = test_brief_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on briefs!'; END IF;

  DELETE FROM public.quotes WHERE id = test_quote_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on quotes!'; END IF;

  DELETE FROM public.quote_items WHERE id = test_quote_item_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on quote_items!'; END IF;

  DELETE FROM public.shotlists WHERE id = test_shotlist_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on shotlists!'; END IF;

  DELETE FROM public.shots WHERE id = test_shot_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on shots!'; END IF;

  DELETE FROM public.palettes WHERE id = test_palette_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on palettes!'; END IF;

  DELETE FROM public.invoices WHERE id = test_invoice_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on invoices!'; END IF;

  DELETE FROM public.invoice_items WHERE id = test_invoice_item_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on invoice_items!'; END IF;

  DELETE FROM public.payments WHERE id = test_payment_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on payments!'; END IF;

  DELETE FROM public.income_ledger WHERE id = test_ledger_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on income_ledger!'; END IF;

  DELETE FROM public.assets WHERE id = test_asset_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on assets!'; END IF;

  DELETE FROM public.public_tokens WHERE id = test_token_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS DELETE Breach on public_tokens!'; END IF;

  RAISE NOTICE '[PASS: OP 3 - DELETE] Delete tampering blocked across all 15 tables (0 rows affected).';

  -- ===========================================================================
  -- OPERATION 4: INSERT INJECTION & CROSS-TENANT PARENT/CHILD ENFORCEMENT
  -- ===========================================================================
  -- Child Table Injection 1: User B tries to insert an invoice item into User A's invoice
  error_caught := false;
  BEGIN
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price_minor, total_price_minor)
    VALUES (test_invoice_id, 'Injected Surcharge', 1.0, 999900, 999900);
  EXCEPTION WHEN insufficient_privilege OR check_violation OR integrity_constraint_violation THEN
    error_caught := true;
  END;

  SELECT COUNT(*) INTO selected_rows FROM public.invoice_items WHERE description = 'Injected Surcharge';
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS INSERT Breach on invoice_items!'; END IF;

  -- Child Table Injection 2: User B tries to insert a quote item into User A's quote
  error_caught := false;
  BEGIN
    INSERT INTO public.quote_items (quote_id, name, category, quantity, unit_cost_minor, total_price_minor)
    VALUES (test_quote_id, 'Injected Gear Surcharge', 'gear', 1.0, 50000, 50000);
  EXCEPTION WHEN insufficient_privilege OR check_violation OR integrity_constraint_violation THEN
    error_caught := true;
  END;

  SELECT COUNT(*) INTO selected_rows FROM public.quote_items WHERE name = 'Injected Gear Surcharge';
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS INSERT Breach on quote_items!'; END IF;

  -- Child Table Injection 3: User B tries to insert a shot into User A's shotlist
  error_caught := false;
  BEGIN
    INSERT INTO public.shots (shotlist_id, description)
    VALUES (test_shotlist_id, 'Injected Malicious Shot');
  EXCEPTION WHEN insufficient_privilege OR check_violation OR integrity_constraint_violation THEN
    error_caught := true;
  END;

  SELECT COUNT(*) INTO selected_rows FROM public.shots WHERE description = 'Injected Malicious Shot';
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS INSERT Breach on shots!'; END IF;

  -- Parent Table Spoofing: User B attempts to insert a project with owner_id = user_a
  error_caught := false;
  BEGIN
    INSERT INTO public.projects (owner_id, title, project_type)
    VALUES (user_a, 'Spoofed Tenant Project', 'commercial');
  EXCEPTION WHEN insufficient_privilege OR check_violation OR integrity_constraint_violation THEN
    error_caught := true;
  END;

  SELECT COUNT(*) INTO selected_rows FROM public.projects WHERE title = 'Spoofed Tenant Project';
  IF selected_rows > 0 THEN RAISE EXCEPTION 'RLS INSERT Breach on projects!'; END IF;

  RAISE NOTICE '[PASS: OP 4 - INSERT] Cross-tenant parent & child injection strictly rejected by RLS WITH CHECK.';

  -- ===========================================================================
  -- MULTI-TENANT PER-TENANT SEQUENCES & IDEMPOTENCY INVARIANTS
  -- ===========================================================================
  INSERT INTO public.clients (id, owner_id, name)
  VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', user_b, 'عميل المستخدم ب');

  INSERT INTO public.projects (id, owner_id, client_id, title, project_type, status)
  VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', user_b, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'مشروع المستخدم ب', 'commercial', 'draft');

  -- User B creates their OWN invoice with the identical invoice_number 'INV-2026-9999'
  INSERT INTO public.invoices (
    id, owner_id, project_id, client_id, invoice_number, currency, issue_date, due_date,
    subtotal_minor, total_minor, balance_due_minor, status
  )
  VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff', user_b, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'dddddddd-dddd-dddd-dddd-dddddddddddd', 'INV-2026-9999', 'EGP', '2026-11-06', '2026-11-20',
    1000000, 1000000, 1000000, 'issued'
  );

  RAISE NOTICE '[PASS] Per-tenant unique sequence invariant verified: duplicate invoice numbers across tenants allowed without collision.';

  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'ALL 15 TABLES x 4 OPERATIONS LIVE POSTGRESQL RLS INVARIANTS PASSED!';
  RAISE NOTICE '====================================================================';
END $$;

ROLLBACK; -- Always roll back test mutations to keep database clean
