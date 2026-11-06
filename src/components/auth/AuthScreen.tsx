"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";

interface AuthScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AuthScreen({ onSuccess, onCancel }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [localSuccessMsg, setLocalSuccessMsg] = useState<string | null>(null);

  const {
    login,
    register,
    loginWithGoogle,
    resetPassword,
    isLoading,
    error,
    clearError,
    isConfigured,
    confirmationPending,
    resetConfirmationNotice,
  } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalSuccessMsg(null);
    try {
      await login(email, password);
      onSuccess?.();
    } catch {
      // Error handled in store
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalSuccessMsg(null);
    try {
      await register(email, password, fullName);
      if (!confirmationPending) {
        onSuccess?.();
      }
    } catch {
      // Error handled in store
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await resetPassword(email);
      setLocalSuccessMsg("تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.");
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-charcoal/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-md bg-soft-ivory border-border-subtle shadow-2xl relative">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 start-4 text-text-secondary hover:text-warm-charcoal p-1.5 rounded-lg text-sm flex items-center gap-1 min-touch-target cursor-pointer"
            aria-label="العودة"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>العودة</span>
          </button>
        )}

        <CardHeader className="text-center pt-8 pb-4">
          <div className="w-12 h-12 rounded-xl bg-deep-olive text-warm-ivory flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-alexandria text-warm-charcoal">
            {tab === "login" && "تسجيل الدخول إلى الاستوديو"}
            {tab === "register" && "إنشاء حساب مصور جديد"}
            {tab === "forgot" && "استعادة كلمة المرور"}
          </CardTitle>
          <CardDescription className="text-text-secondary text-sm">
            {tab === "login" && "أدخل بياناتك المعتمدة للوصول إلى مساحة عملك"}
            {tab === "register" && "انضم لمنظومة عمل المصورين المستقلين مجاناً 100%"}
            {tab === "forgot" && "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط الاستعادة"}
          </CardDescription>

          {!isConfigured && (
            <div className="mt-3 p-3 rounded-lg bg-status-warning-bg border border-status-warning/40 text-status-warning text-xs text-start flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">إعدادات Supabase غير مكتملة:</span>
                تطبيق قرار ADR-012 الإلزامي: يُمنع أي تجاوز للمصادقة أو دخول وهمي. يرجى تهيئة NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_ANON_KEY في بيئة التشغيل لتمكين الدخول.
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Confirmation Pending Banner */}
          {confirmationPending && (
            <div className="p-3.5 rounded-lg bg-status-success-bg border border-status-success/30 text-status-success text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>تم إنشاء الحساب بنجاح! يلزم تأكيد البريد الإلكتروني.</span>
              </div>
              <p className="text-text-secondary">
                أرسلنا رابط التحقق إلى بريدك الإلكتروني. يرجى فتح البريد والضغط على الرابط لتأكيد حسابك قبل تسجيل الدخول إلى مساحة العمل.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  resetConfirmationNotice();
                  setTab("login");
                }}
              >
                الانتقال لتسجيل الدخول بعد التأكيد
              </Button>
            </div>
          )}

          {/* Success Banner */}
          {localSuccessMsg && (
            <div className="p-3 rounded-lg bg-status-success-bg border border-status-success/30 text-status-success text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{localSuccessMsg}</span>
            </div>
          )}

          {/* Social Google OAuth Button */}
          {tab !== "forgot" && !confirmationPending && (
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2.5 py-2.5 bg-soft-ivory hover:bg-sand-beige/30 border-border-subtle text-warm-charcoal min-touch-target"
                onClick={() => loginWithGoogle()}
                disabled={isLoading || !isConfigured}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-medium">المتابعة باستخدام Google</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-soft-ivory px-2 text-text-secondary">أو عبر البريد الإلكتروني</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {tab === "login" && !confirmationPending && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-charcoal flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-bronze" />
                  <span>البريد الإلكتروني</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-warm-ivory/50 focus:bg-soft-ivory focus:outline-deep-olive"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-warm-charcoal flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-bronze" />
                    <span>كلمة المرور</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setTab("forgot");
                    }}
                    className="text-xs text-deep-olive hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-warm-ivory/50 focus:bg-soft-ivory focus:outline-deep-olive"
                />
              </div>

              <Button type="submit" disabled={isLoading || !isConfigured} className="w-full py-2.5 min-touch-target">
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          )}

          {tab === "register" && !confirmationPending && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-charcoal flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-bronze" />
                  <span>الاسم الكامل / اسم الاستوديو</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف محمد / استوديو القاهرة"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-warm-ivory/50 focus:bg-soft-ivory focus:outline-deep-olive"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-charcoal flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-bronze" />
                  <span>البريد الإلكتروني</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-warm-ivory/50 focus:bg-soft-ivory focus:outline-deep-olive"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-charcoal flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-bronze" />
                  <span>كلمة المرور (8 أحرف على الأقل)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-warm-ivory/50 focus:bg-soft-ivory focus:outline-deep-olive"
                />
              </div>

              <Button type="submit" disabled={isLoading || !isConfigured} className="w-full py-2.5 min-touch-target">
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب مصور جديد"}
              </Button>
            </form>
          )}

          {tab === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-charcoal flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-bronze" />
                  <span>البريد الإلكتروني المسجل</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-warm-ivory/50 focus:bg-soft-ivory focus:outline-deep-olive"
                />
              </div>

              <Button type="submit" disabled={isLoading || !isConfigured} className="w-full py-2.5 min-touch-target">
                {isLoading ? "جاري الإرسال..." : "إرسال رابط استعادة كلمة المرور"}
              </Button>
            </form>
          )}

          {/* Toggle Tab Footer */}
          <div className="pt-3 border-t border-border-subtle text-center text-xs text-text-secondary">
            {tab === "login" && (
              <p>
                ليس لديك حساب بعد؟{" "}
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setTab("register");
                  }}
                  className="font-semibold text-deep-olive hover:underline cursor-pointer"
                >
                  إنشاء حساب جديد مجاناً
                </button>
              </p>
            )}

            {(tab === "register" || tab === "forgot") && (
              <p>
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setTab("login");
                  }}
                  className="font-semibold text-deep-olive hover:underline cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
