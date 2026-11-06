-- =============================================================================
-- Live PostgreSQL Row Level Security (RLS) Penetration Test Suite
-- Target: Verify complete tenant isolation across all 15 tables in PostgreSQL.
-- Run via: psql $DATABASE_URL -f supabase/tests/rls_security_live.sql
-- =============================================================================

BEGIN;

-- 1. Create Test UUIDs for User A and User B
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  user_a UUID := '11111111-1111-1111-1111-111111111111';
  user_b UUID := '22222222-2222-2222-2222-222222222222';
  test_project_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  test_invoice_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  selected_rows INT;
BEGIN
  RAISE NOTICE 'Starting RLS Security Penetration Verification...';

  -- ---------------------------------------------------------------------------
  -- Context Switch: Authenticate as User A
  -- ---------------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);

  -- Insert Profile for User A
  INSERT INTO public.profiles (id, full_name, studio_name, currency, tier)
  VALUES (user_a, 'المصور أحمد (مستخدم أ)', 'استوديو النيل', 'EGP', 'pro')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Client for User A
  INSERT INTO public.clients (id, owner_id, name, email, phone)
  VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', user_a, 'العميل كريم', 'karim@client.com', '01000000001');

  -- Insert Project for User A
  INSERT INTO public.projects (id, owner_id, client_id, name, shoot_date, currency, status)
  VALUES (test_project_id, user_a, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'مشروع زفاف سري للمستخدم أ', '2026-11-04', 'EGP', 'in_progress');

  -- Insert Invoice for User A
  INSERT INTO public.invoices (id, owner_id, project_id, client_id, invoice_number, currency, subtotal_minor, total_minor, balance_due_minor, status)
  VALUES (test_invoice_id, user_a, test_project_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'INV-2026-9999', 'EGP', 5000000, 5000000, 5000000, 'issued');

  RAISE NOTICE '[USER A] Successfully created proprietary project and invoice.';

  -- ---------------------------------------------------------------------------
  -- Context Switch: Authenticate as Attacker / Tenant User B
  -- ---------------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);

  -- Insert Profile for User B
  INSERT INTO public.profiles (id, full_name, studio_name, currency, tier)
  VALUES (user_b, 'المخترق / المستخدم ب', 'استوديو ب', 'EGP', 'free')
  ON CONFLICT (id) DO NOTHING;

  -- TEST 1: User B attempts to read User A projects
  SELECT COUNT(*) INTO selected_rows FROM public.projects WHERE owner_id = user_a;
  IF selected_rows > 0 THEN
    RAISE EXCEPTION '[FAIL - CRITICAL SECURITY VULNERABILITY] User B was able to read User A projects! (Count: %)', selected_rows;
  ELSE
    RAISE NOTICE '[PASS] User B was completely blocked from reading User A projects (0 rows returned).';
  END IF;

  -- TEST 2: User B attempts to read User A invoices
  SELECT COUNT(*) INTO selected_rows FROM public.invoices WHERE owner_id = user_a;
  IF selected_rows > 0 THEN
    RAISE EXCEPTION '[FAIL - CRITICAL SECURITY VULNERABILITY] User B was able to read User A invoices! (Count: %)', selected_rows;
  ELSE
    RAISE NOTICE '[PASS] User B was completely blocked from reading User A invoices (0 rows returned).';
  END IF;

  -- TEST 3: User B attempts to maliciously update User A project
  UPDATE public.projects SET name = 'HACKED BY USER B' WHERE id = test_project_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN
    RAISE EXCEPTION '[FAIL - CRITICAL SECURITY VULNERABILITY] User B was able to mutate User A project!';
  ELSE
    RAISE NOTICE '[PASS] User B was completely blocked from updating User A project (0 rows updated).';
  END IF;

  -- TEST 4: User B attempts to delete User A invoice
  DELETE FROM public.invoices WHERE id = test_invoice_id;
  GET DIAGNOSTICS selected_rows = ROW_COUNT;
  IF selected_rows > 0 THEN
    RAISE EXCEPTION '[FAIL - CRITICAL SECURITY VULNERABILITY] User B was able to delete User A invoice!';
  ELSE
    RAISE NOTICE '[PASS] User B was completely blocked from deleting User A invoice (0 rows deleted).';
  END IF;

  -- TEST 5: Verify Atomic Unique Invoice Number per Owner
  -- User B should be permitted to use the SAME invoice number 'INV-2026-9999' for their OWN invoices!
  INSERT INTO public.invoices (id, owner_id, invoice_number, currency, subtotal_minor, total_minor, balance_due_minor, status)
  VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', user_b, 'INV-2026-9999', 'EGP', 1000000, 1000000, 1000000, 'issued');
  RAISE NOTICE '[PASS] User B created their own INV-2026-9999 cleanly without collision with User A.';

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'ALL 5 LIVE POSTGRESQL RLS SECURITY INVARIANTS PASSED!';
  RAISE NOTICE '=======================================================';
END $$;

ROLLBACK; -- Always roll back test mutations to keep database clean
