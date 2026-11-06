"use client";

import React from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Plus } from "lucide-react";

export function CrmScreen() {
  const { client } = useProjectStore();

  const clientsList = [
    client,
    {
      id: "client-2",
      name: "سارة وخالد الرفاعي",
      email: "sarah.refai@example.com",
      phone: "+20 111 987 6543",
      company: "حفل خاص",
      notes: "تصوير جلسة خطوبة في الهواء الطلق، مع التركيز على لقطات البورتريه السينمائية والـ 85mm.",
    },
    {
      id: "client-3",
      name: "شركة نكست ميديا للإنتاج",
      email: "info@nextmedia-eg.com",
      phone: "+20 122 333 4444",
      company: "Next Media Production",
      notes: "إعلان تجاري لمنتج غذائي، كاميرتان 4K وتسجيل صوتي خارجي احترافي.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">طبقة الأعمال</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">إدارة علاقات العملاء (CRM)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            سجل العملاء، تاريخ المشروعات، والتواصل المباشر مع الحفاظ على الخصوصية الكاملة.
          </p>
        </div>

        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientsList.map((c) => (
          <Card key={c.id} className="flex flex-col justify-between hover:border-deep-olive transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{c.name}</CardTitle>
                {c.id === client.id && <Badge variant="bronze">المشروع الحالي</Badge>}
              </div>
              <CardDescription>{c.company}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-mono">{c.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-3.5 h-3.5" />
                <span className="font-mono">{c.email}</span>
              </div>
              <p className="p-2.5 rounded bg-warm-ivory border border-border-subtle text-warm-charcoal line-clamp-3">
                {c.notes}
              </p>
            </CardContent>
            <div className="p-4 pt-0 border-t border-border-subtle/50 mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs">
                فتح المشروعات
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 text-xs">
                مراسلة WhatsApp
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
