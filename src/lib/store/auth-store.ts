import { create } from "zustand";
import { AuthService, AuthUser } from "../auth/auth-service";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  isMockMode: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  isMockMode: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const { user, isMockMode } = await AuthService.initializeSession();
      set({ user, isMockMode, isInitialized: true, isLoading: false });
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
      const user = await AuthService.signUp(email, pass, name);
      set({ user, isLoading: false });
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
}));
