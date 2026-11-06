import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  if (error || errorDescription) {
    const errorMsg = errorDescription || error || "فشل تسجيل الدخول عبر موفر الخدمة";
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    const { url, anonKey, isConfigured } = getSupabaseEnv();
    if (isConfigured) {
      try {
        const supabase = createClient(url, anonKey);
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[AuthCallback] Code exchange failed:", exchangeError.message);
          return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`);
        }
      } catch (err) {
        console.error("[AuthCallback] Code exchange exception:", err);
      }
    }
  }

  // Redirect to application destination after OAuth handshake
  return NextResponse.redirect(`${origin}${next}`);
}
