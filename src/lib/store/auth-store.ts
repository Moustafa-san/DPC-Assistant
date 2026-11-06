import { create } from "zustand";
import { AuthService, AuthUser } from "../auth/auth-service";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  isConfigured: boolean;
  confirmationPending: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetConfirmationNotice: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  isConfigured: false,
  confirmationPending: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const { user, isConfigured } = await AuthService.initializeSession();
      set({ user, isConfigured, isInitialized: true, isLoading: false });

      // Subscribe to real-time session changes from Supabase
      if (isConfigured) {
        AuthService.onAuthStateChange((_event, session) => {
          if (session?.user) {
            set({
              user: {
                id: session.user.id,
                email: session.user.email || "",
                fullName: session.user.user_metadata?.full_name,
                avatarUrl: session.user.user_metadata?.avatar_url,
              },
              confirmationPending: false,
            });
          } else {
            set({ user: null });
          }
        });
      }
    } catch {
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, pass) => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signInWithPassword(email, pass);
      set({ user, isLoading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "فشل تسجيل الدخول",
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (email, pass, name) => {
    try {
      set({ isLoading: true, error: null });
      const result = await AuthService.signUp(email, pass, name);
      if (result.confirmationPending) {
        set({
          user: null,
          confirmationPending: true,
          isLoading: false,
        });
      } else {
        set({
          user: result.user,
          confirmationPending: false,
          isLoading: false,
        });
      }
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "فشل إنشاء الحساب",
        isLoading: false,
      });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      await AuthService.signInWithGoogle();
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "فشل تسجيل الدخول عبر Google",
        isLoading: false,
      });
      throw err;
    }
  },

  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });
      await AuthService.resetPassword(email);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "تعذر إرسال رابط الاستعادة",
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    await AuthService.signOut();
    set({ user: null, error: null });
  },

  clearError: () => set({ error: null }),
  resetConfirmationNotice: () => set({ confirmationPending: false }),
}));
