"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, CheckCircle2, Copy, ExternalLink, ShieldCheck } from "lucide-react";

export function BriefScreen() {
  const { briefScope, briefRequirements, publicBriefToken, generateBriefPublicLink, client, projectTitle } =
    useProjectStore();
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = () => {
    generateBriefPublicLink();
  };

  const handleCopy = () => {
    if (publicBriefToken) {
      navigator.clipboard.writeText(`https://photographer-assistant.app/ar/p/${publicBriefToken}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 1</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">منشئ البريف (Brief Builder)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            توثيق متطلبات ونطاق العمل لمشروع «{projectTitle}» مع توليد رابط مشاركة مشفر للعميل.
          </p>
        </div>

        <Button onClick={handleGenerateLink} className="gap-2 shrink-0">
          <Share2 className="w-4 h-4" />
          <span>{publicBriefToken ? "تحديث رابط العميل المشفر" : "توليد رابط العميل المشفر"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نطاق العمل المتفق عليه (Project Scope)</CardTitle>
              <CardDescription>الوصف الفني والتفصيلي لمخرجات المشروع</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-warm-charcoal bg-warm-ivory p-4 rounded-lg border border-border-subtle">
                {briefScope}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">متطلبات العميل والمواصفات الفنية</CardTitle>
              <CardDescription>البنود الإلزامية المطلوبة في يوم التصوير والتسليم</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {briefRequirements.map((req, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-warm-ivory/60 border border-border-subtle/80 text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-deep-olive shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">بيانات العميل (Client Info)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-text-secondary">اسم العميل:</span>
                <p className="font-semibold text-warm-charcoal">{client.name}</p>
              </div>
              <div>
                <span className="text-xs text-text-secondary">البريد الإلكتروني:</span>
                <p className="font-mono text-xs text-text-secondary">{client.email}</p>
              </div>
              <div>
                <span className="text-xs text-text-secondary">رقم الهاتف:</span>
                <p className="font-mono text-xs text-text-secondary">{client.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-deep-olive/30 bg-soft-ivory">
            <CardHeader>
              <div className="flex items-center gap-2 text-deep-olive">
                <ShieldCheck className="w-5 h-5" />
                <CardTitle className="text-base">الرابط العام المشفر للعميل</CardTitle>
              </div>
              <CardDescription>
                صلاحية مؤقتة 72 ساعة، محدد بمعدل 30 طلباً/دقيقة، ولا يكشف أي بيانات داخلية.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publicBriefToken ? (
                <div className="space-y-3">
                  <div className="p-2.5 bg-warm-ivory rounded border border-border-subtle font-mono text-xs truncate">
                    https://photographer-assistant.app/ar/p/{publicBriefToken}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 flex-1">
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? "تم النسخ!" : "نسخ الرابط"}</span>
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1.5 flex-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>معاينة الرابط</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-text-secondary">
                  لم يتم إنشاء رابط عام بعد. اضغط على «توليد رابط العميل المشفر» أعلاه.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
