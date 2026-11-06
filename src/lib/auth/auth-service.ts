import { getBrowserSupabaseClient } from "../supabase/client";
import { getSupabaseEnv } from "../supabase/config";
import type { Session, Subscription } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface SignUpResult {
  user: AuthUser | null;
  confirmationPending: boolean;
}

/**
 * Production-grade Supabase Authentication Service.
 * Strictly adheres to ADR-012:
 * - Zero Mock Mode or bypasses.
 * - Missing Supabase credentials strictly prevents workspace unlock.
 * - Confirmed session is mandatory before opening workspace.
 */
export class AuthService {
  /**
   * Retrieves active, verified session on boot.
   */
  public static async initializeSession(): Promise<{ user: AuthUser | null; isConfigured: boolean }> {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      return { user: null, isConfigured: false };
    }

    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return { user: null, isConfigured: true };
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        },
        isConfigured: true,
      };
    } catch (err) {
      console.error("[AuthService] Error initializing Supabase session:", err);
      return { user: null, isConfigured: true };
    }
  }

  /**
   * Subscribes to real Supabase session events.
   */
  public static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): { subscription: Subscription } | null {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) return null;

    try {
      const supabase = getBrowserSupabaseClient();
      const { data } = supabase.auth.onAuthStateChange(callback);
      return data;
    } catch (err) {
      console.error("[AuthService] Failed to bind auth state listener:", err);
      return null;
    }
  }

  /**
   * Signs in with Email and Password against Supabase Auth.
   */
  public static async signInWithPassword(email: string, password: string): Promise<AuthUser> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      throw new Error("إعدادات Supabase غير مهيأة. الدخول معطل لحماية البيانات.");
    }

    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      // Generic message to prevent account enumeration (ASVS Level 2)
      throw new Error("بيانات الاعتماد غير صالحة، أو الحساب غير مؤكد.");
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      fullName: data.user.user_metadata?.full_name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };
  }

  /**
   * Signs up a new account. If email confirmation is required, session will be null.
   */
  public static async signUp(email: string, password: string, fullName: string): Promise<SignUpResult> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      throw new Error("إعدادات Supabase غير مهيأة. إنشاء الحساب معطل لحماية البيانات.");
    }

    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || "تعذر إنشاء الحساب.");
    }

    // In Supabase, if confirmation is enabled, session will be null
    if (!data.session) {
      return {
        user: null,
        confirmationPending: true,
      };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        fullName,
      },
      confirmationPending: false,
    };
  }

  /**
   * Initiates Google OAuth flow via Supabase.
   */
  public static async signInWithGoogle(): Promise<void> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      throw new Error("إعدادات Supabase غير مهيأة. تسجيل الدخول عبر Google معطل لحماية البيانات.");
    }

    const supabase = getBrowserSupabaseClient();
    const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error("فشل بدء تدفق Google OAuth: " + error.message);
    }
  }

  /**
   * Sends Password Reset Email.
   */
  public static async resetPassword(email: string): Promise<void> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      throw new Error("إعدادات Supabase غير مهيأة.");
    }

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined,
    });

    if (error) {
      throw new Error("إذا كان البريد مسجلاً، فستصلك رسالة إعادة ضبط كلمة المرور.");
    }
  }

  /**
   * Signs Out and destroys active session.
   */
  public static async signOut(): Promise<void> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) return;

    try {
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthService] Error during Supabase signOut:", err);
    }
  }
}
