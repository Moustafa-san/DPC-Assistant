import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

let cachedBrowserClient: SupabaseClient | null = null;

/**
 * Returns a browser Supabase client using the safe public anonymous key.
 * Throws a descriptive error if called when Supabase is not configured.
 */
export function getBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    throw new Error(
      "Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment."
    );
  }

  if (!cachedBrowserClient) {
    cachedBrowserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedBrowserClient;
}
