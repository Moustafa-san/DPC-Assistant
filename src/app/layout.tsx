import type { Metadata } from "next";
import { Cairo, Alexandria, Inter } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مساعد المصور | Photographer Assistant",
  description: "نظام تشغيل متكامل للمصور المستقل وصانع الفيديو — من البريف للفلوس",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${alexandria.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-warm-ivory text-warm-charcoal selection:bg-deep-olive selection:text-warm-ivory font-cairo">
        {children}
      </body>
    </html>
  );
}
