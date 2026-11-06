import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const { url, anonKey, isConfigured } = getSupabaseEnv();
    if (isConfigured) {
      try {
        const supabase = createClient(url, anonKey);
        await supabase.auth.exchangeCodeForSession(code);
      } catch (err) {
        console.error("[AuthCallback] Code exchange failed:", err);
      }
    }
  }

  // Redirect to application root after OAuth handshake
  return NextResponse.redirect(`${origin}/`);
}
