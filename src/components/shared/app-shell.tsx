"use client";

import React, { useState, useEffect } from "react";
import { Locale } from "@/lib/types/common";
import { getDictionary, getDirection } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  FileText,
  Calculator,
  Film,
  HardDrive,
  Palette,
  CalendarDays,
  Receipt,
  Users,
  CheckSquare,
  BarChart3,
  Languages,
  Wifi,
  WifiOff,
  Menu,
  X,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";

interface AppShellProps {
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AppShell({ children, activeTab: propActiveTab, onTabChange }: AppShellProps) {
  const { user, logout } = useAuthStore();
  const [locale, setLocale] = useState<Locale>("ar");
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState("home");

  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const setActiveTab = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const dict = getDictionary(locale);
  const dir = getDirection(locale);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleLocale = () => {
    setLocale((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const navItems = [
    { id: "home", label: dict.navigation.home, icon: Camera },
    { id: "brief", label: dict.navigation.brief, icon: FileText },
    { id: "cost", label: dict.navigation.cost, icon: Calculator },
    { id: "shotlist", label: dict.navigation.shotlist, icon: Film },
    { id: "storage", label: dict.navigation.storage, icon: HardDrive },
    { id: "palette", label: dict.navigation.palette, icon: Palette },
    { id: "calendar", label: dict.navigation.calendar, icon: CalendarDays },
    { id: "invoice", label: dict.navigation.invoice, icon: Receipt },
    { id: "crm", label: dict.navigation.crm, icon: Users },
    { id: "tasks", label: dict.navigation.tasks, icon: CheckSquare },
    { id: "business", label: dict.navigation.business, icon: BarChart3 },
    { id: "sop", label: "دليل الإجراءات (SOP)", icon: BookOpen },
  ];

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-warm-ivory text-warm-charcoal">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-soft-ivory/95 backdrop-blur-sm px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-sand-beige/40 text-warm-charcoal min-touch-target flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-deep-olive flex items-center justify-center text-warm-ivory shadow-xs">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-alexandria font-semibold text-lg leading-tight tracking-tight text-warm-charcoal">
                  {dict.common.appName}
                </h1>
                <p className="text-xs text-text-secondary hidden sm:block">
                  {dict.common.tagline}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isOnline ? (
              <Badge variant="success" className="gap-1.5 py-1 px-2.5 hidden sm:inline-flex">
                <Wifi className="w-3.5 h-3.5" />
                <span>{dict.common.syncedBadge}</span>
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1.5 py-1 px-2.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>{dict.common.offlineBadge}</span>
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleLocale}
              className="gap-1.5 font-medium min-touch-target"
            >
              <Languages className="w-4 h-4 text-muted-bronze" />
              <span>{locale === "ar" ? "English" : "العربية"}</span>
            </Button>

            {user && (
              <div className="flex items-center gap-2 border-s border-border-subtle ps-2 sm:ps-3">
                <div className="hidden md:flex flex-col text-end">
                  <span className="text-xs font-semibold text-warm-charcoal truncate max-w-[130px]">
                    {user.fullName || user.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-text-secondary truncate max-w-[130px]">
                    {user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  title="تسجيل الخروج"
                  aria-label="تسجيل الخروج"
                  className="p-2 text-text-secondary hover:text-status-error min-touch-target"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (>1024px) */}
        <aside aria-label={dict.shell.workspaceTitle} className="hidden lg:flex flex-col w-64 border-e border-border-subtle bg-soft-ivory p-4 gap-1 shrink-0">
          <div className="text-xs font-semibold text-text-secondary px-3 py-2 uppercase tracking-wider">
            {dict.shell.workspaceTitle}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-start min-touch-target cursor-pointer ${
                  isActive
                    ? "bg-deep-olive text-warm-ivory shadow-xs"
                    : "text-warm-charcoal hover:bg-sand-beige/40"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-warm-ivory" : "text-muted-bronze"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tablet Rail (768px - 1024px) */}
        <aside aria-label="Tablet navigation rail" className="hidden md:flex lg:hidden flex-col w-20 border-e border-border-subtle bg-soft-ivory p-2 items-center gap-2 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`p-3 rounded-xl transition-colors min-touch-target flex items-center justify-center cursor-pointer ${
                  isActive
                    ? "bg-deep-olive text-warm-ivory"
                    : "text-warm-charcoal hover:bg-sand-beige/40"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div role="dialog" aria-modal="true" aria-label="Mobile navigation menu" className="lg:hidden fixed inset-0 z-50 bg-warm-charcoal/40 backdrop-blur-xs flex">
            <div className="w-72 bg-soft-ivory h-full p-4 flex flex-col gap-1 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <span className="font-semibold text-warm-charcoal">{dict.shell.workspaceTitle}</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1 rounded-md hover:bg-sand-beige/40 min-touch-target flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pt-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-start min-touch-target ${
                        isActive
                          ? "bg-deep-olive text-warm-ivory"
                          : "text-warm-charcoal hover:bg-sand-beige/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<768px) */}
      <nav aria-label="Mobile bottom navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-soft-ivory/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg pb-safe">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium min-touch-target transition-colors ${
                isActive ? "text-deep-olive font-semibold" : "text-text-secondary hover:text-warm-charcoal"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-deep-olive" : "text-text-secondary"}`} />
              <span className="mt-1 truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
