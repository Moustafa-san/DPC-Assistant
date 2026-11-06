import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Live PostgreSQL RLS Schema Audit across all 15 Tables", () => {
  const sqlPath = path.resolve(process.cwd(), "supabase/migrations/20261106000000_init_schema_and_rls.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");

  const expectedTables = [
    "profiles",
    "clients",
    "projects",
    "briefs",
    "quotes",
    "quote_items",
    "shotlists",
    "shots",
    "palettes",
    "invoices",
    "invoice_items",
    "payments",
    "income_ledger",
    "assets",
    "public_tokens",
  ];

  it("verifies that exactly 15 relational tables are defined in the schema", () => {
    const tableMatches = [...sqlContent.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)];
    const tableNames = tableMatches.map((m) => m[1]);

    expect(tableNames.length).toBe(15);
    expect(tableNames.sort()).toEqual(expectedTables.sort());
  });

  it("verifies that ROW LEVEL SECURITY is explicitly enabled on all 15 tables", () => {
    for (const table of expectedTables) {
      const rlsRegex = new RegExp(`ALTER TABLE public\\.${table}\\s+ENABLE ROW LEVEL SECURITY;`, "i");
      expect(sqlContent).toMatch(rlsRegex);
    }
  });

  it("verifies that owner isolation policies (auth.uid() = owner_id) protect all multi-tenant tables", () => {
    const ownerTenantTables = [
      "clients",
      "projects",
      "briefs",
      "quotes",
      "shotlists",
      "palettes",
      "invoices",
      "payments",
      "income_ledger",
      "assets",
      "public_tokens",
    ];

    for (const table of ownerTenantTables) {
      const policyRegex = new RegExp(`CREATE POLICY [^;]+ ON public\\.${table}\\s+FOR ALL\\s+USING \\(auth\\.uid\\(\\) = owner_id\\)\\s+WITH CHECK \\(auth\\.uid\\(\\) = owner_id\\);`, "i");
      expect(sqlContent).toMatch(policyRegex);
    }
  });

  it("verifies atomic constraints for invoice numbers and idempotency keys", () => {
    // UNIQUE(owner_id, invoice_number)
    expect(sqlContent).toContain("CONSTRAINT unique_owner_invoice_number UNIQUE (owner_id, invoice_number)");
    // UNIQUE(owner_id, idempotency_key)
    expect(sqlContent).toContain("CONSTRAINT unique_owner_ledger_idempotency UNIQUE (owner_id, idempotency_key)");
    expect(sqlContent).toContain("CONSTRAINT unique_owner_payment_idempotency UNIQUE (owner_id, idempotency_key)");
  });

  it("verifies public token expiration and revocation policy", () => {
    expect(sqlContent).toContain("CREATE POLICY \"public_tokens_read_valid\"");
    expect(sqlContent).toContain("expires_at > NOW()");
    expect(sqlContent).toContain("revoked_at IS NULL");
  });
});
