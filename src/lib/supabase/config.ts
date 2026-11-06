/**
 * Supabase Environment Configuration & Guardrails.
 * 
 * Enforces that Service Role keys are NEVER exposed to browser bundles,
 * and detects when Supabase is unconfigured, preventing implicit bypasses.
 */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(url && anonKey && url.startsWith("https://"));

  return {
    url: url || "",
    anonKey: anonKey || "",
    isConfigured,
  };
}

/**
 * Asserts that the code is running in a server context before accessing privileged operations.
 */
export function assertServerOnly(contextName: string) {
  if (typeof window !== "undefined") {
    throw new Error(
      `[SECURITY VIOLATION] ${contextName} can only be executed in a server environment. Service Role keys are strictly forbidden in client bundles.`
    );
  }
}
