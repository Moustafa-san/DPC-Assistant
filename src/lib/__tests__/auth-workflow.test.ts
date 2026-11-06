import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../auth/auth-service";
import { useAuthStore } from "../store/auth-store";
import { GET as AuthCallbackRoute } from "@/app/auth/callback/route";

describe("Authentication, OAuth & Session Invariants (Commit 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks workspace entry when Supabase credentials are missing (No Mock Mode)", async () => {
    // Calling login or signup without configuration must throw clear error
    await expect(
      AuthService.signInWithPassword("test@example.com", "SecretPass123!")
    ).rejects.toThrow("إعدادات Supabase غير مهيأة");

    await expect(
      AuthService.signUp("new@example.com", "SecretPass123!", "مصور محترف")
    ).rejects.toThrow("إعدادات Supabase غير مهيأة");
  });

  it("handles OAuth callback route redirection and error parameters gracefully", async () => {
    // 1. Error redirection
    const errorReq = new Request("http://localhost:3000/auth/callback?error=access_denied&error_description=User%20cancelled");
    const errorRes = await AuthCallbackRoute(errorReq);

    expect(errorRes.status).toBe(307);
    expect(errorRes.headers.get("location")).toContain("auth_error=User%20cancelled");

    // 2. Normal redirect without code
    const normalReq = new Request("http://localhost:3000/auth/callback");
    const normalRes = await AuthCallbackRoute(normalReq);

    expect(normalRes.status).toBe(307);
    expect(normalRes.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("ensures auth store enforces unauthenticated state when user is null", () => {
    const store = useAuthStore.getState();
    expect(store.user).toBeNull();
  });
});
