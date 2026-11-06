import { getBrowserSupabaseClient } from "../supabase/client";
import { getSupabaseEnv } from "../supabase/config";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isMockMode: boolean; // Indicates if running in offline demo mode without live Supabase
}

// Local storage key for demo session when Supabase is not configured
const DEMO_AUTH_STORAGE_KEY = "dpc_assistant_demo_user";

/**
 * Production-ready Supabase Auth Service with graceful offline development fallback.
 * Strictly adheres to ADR-012 (Auth-gated entry).
 */
export class AuthService {
  /**
   * Initializes authentication state and registers session listener.
   */
  public static async initializeSession(): Promise<{ user: AuthUser | null; isMockMode: boolean }> {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      // Check if developer has a persisted demo session
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
        if (stored) {
          try {
            const user = JSON.parse(stored) as AuthUser;
            return { user, isMockMode: true };
          } catch {
            localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
          }
        }
      }
      return { user: null, isMockMode: true };
    }

    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        return {
          user: {
            id: session.user.id,
            email: session.user.email || "",
            fullName: session.user.user_metadata?.full_name,
            avatarUrl: session.user.user_metadata?.avatar_url,
          },
          isMockMode: false,
        };
      }
      return { user: null, isMockMode: false };
    } catch (err) {
      console.error("[AuthService] Error fetching Supabase session:", err);
      return { user: null, isMockMode: false };
    }
  }

  /**
   * Sign In with Email and Password.
   */
  public static async signInWithPassword(email: string, password: string): Promise<AuthUser> {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      // Offline/Dev Mock Sign In
      if (!email || !password || password.length < 6) {
        throw new Error("بيانات الاعتماد غير صالحة. يجب ألا تقل كلمة المرور عن 6 أحرف.");
      }
      const mockUser: AuthUser = {
        id: "usr-dev-" + Math.abs(email.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email,
        fullName: email.split("@")[0],
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      }
      return mockUser;
    }

    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Generic error message to prevent account enumeration (ASVS Level 2)
      throw new Error("بيانات الدخول غير صحيحة، أو الحساب غير موجود.");
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      fullName: data.user.user_metadata?.full_name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };
  }

  /**
   * Sign Up with Email, Password, and Full Name.
   */
  public static async signUp(email: string, password: string, fullName: string): Promise<AuthUser> {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      if (!email || !password || password.length < 8) {
        throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف لضمان الأمان.");
      }
      const mockUser: AuthUser = {
        id: "usr-dev-" + Date.now(),
        email,
        fullName: fullName || email.split("@")[0],
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      }
      return mockUser;
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
      throw new Error(error?.message || "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.");
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      fullName,
    };
  }

  /**
   * Sign In via Google OAuth.
   */
  public static async signInWithGoogle(): Promise<void> {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      // In dev mock mode, simulate immediate Google login
      const mockUser: AuthUser = {
        id: "usr-google-demo",
        email: "photographer.demo@gmail.com",
        fullName: "مصور تجريبي (Google)",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        window.location.reload();
      }
      return;
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
      throw new Error("فشل بدء تسجيل الدخول عبر Google: " + error.message);
    }
  }

  /**
   * Reset Password Request.
   */
  public static async resetPassword(email: string): Promise<void> {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      // Mock reset response
      return;
    }

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined,
    });

    if (error) {
      // Generic message to avoid enumeration
      throw new Error("إذا كان البريد مسجلاً لدينا، فستصلك رسالة إعادة ضبط كلمة المرور.");
    }
  }

  /**
   * Sign Out and clear session state.
   */
  public static async signOut(): Promise<void> {
    const { isConfigured } = getSupabaseEnv();

    if (typeof window !== "undefined") {
      localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    }

    if (isConfigured) {
      try {
        const supabase = getBrowserSupabaseClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error("[AuthService] Sign out error:", err);
      }
    }
  }
}
