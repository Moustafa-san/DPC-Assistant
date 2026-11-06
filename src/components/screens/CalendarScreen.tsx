"use client";

import React from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { calculateSolarTimes } from "@/lib/solar/calculator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Sunset, Sunrise, MapPin, Printer } from "lucide-react";

export function CalendarScreen() {
  const { shootDate, locationName, latitude, longitude, crewCallTime, projectTitle, client } =
    useProjectStore();

  const solar = calculateSolarTimes(shootDate, { latitude, longitude }, "Africa/Cairo");

  const scheduleTimeline = [
    { time: crewCallTime, title: "حضور وتجمع طاقم التصوير والمساعدين", location: "استراحة الموقع" },
    { time: "14:30", title: "تجهيز وتفقد الكاميرات وضبط العدسات والإضاءة", location: "غرفة المعدات" },
    { time: "15:15", title: "جلسة التجهيز الأولى واللقطات القريبة للتفاصيل", location: "الغرفة الرئيسية" },
    {
      time: solar.eveningGoldenHour.start,
      title: "جلسة تصوير الساعة الذهبية (Golden Hour) — أولوية قصوى",
      location: "الحديقة المفتوحة",
      isHighlight: true,
    },
    { time: solar.sunset, title: "لحظة غروب الشمس وبداية تصوير لقطات الإضاءة الاصطناعية", location: "الممر الخارجي" },
    { time: "18:30", title: "دخول القاعة والحفل والرقصة الأولى", location: "القاعة الكبرى" },
    { time: "22:00", title: "انتهاء التصوير، جرد الكروت، وعمل نسخة احتياطية فورية", location: "غرفة التحكم" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 6</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">التقويم وورقة الأوردر (Call Sheet)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            جدولة مواعيد التصوير، ورقة الأوردر الميدانية، ومواقيت الشمس الفلكية وفق خوارزميات NOAA.
          </p>
        </div>

        <Button variant="outline" className="gap-2 shrink-0">
          <Printer className="w-4 h-4" />
          <span>طباعة ورقة الأوردر</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Sheet Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">جدول المواعيد الميداني (Day-Of Schedule)</CardTitle>
                  <CardDescription>مشروع: {projectTitle} • العميل: {client.name}</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">{shootDate}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduleTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-3.5 rounded-lg border transition-all ${
                      item.isHighlight
                        ? "bg-sand-beige/40 border-muted-bronze/60 shadow-2xs"
                        : "bg-warm-ivory/60 border-border-subtle"
                    }`}
                  >
                    <div className="pt-0.5 text-center shrink-0 w-16">
                      <span className="font-mono font-bold text-sm text-deep-olive bg-soft-ivory px-2 py-0.5 rounded border border-border-subtle">
                        {item.time}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-warm-charcoal">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                    {item.isHighlight && (
                      <Badge variant="bronze" className="text-2xs shrink-0">
                        الساعة الذهبية
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NOAA Solar Intelligence */}
        <div className="space-y-6">
          <Card className="bg-soft-ivory border-deep-olive/20">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-bronze">
                <Sun className="w-5 h-5" />
                <CardTitle className="text-base">مواقيت شمس القاهرة الفلكية (NOAA)</CardTitle>
              </div>
              <CardDescription>حسابات فلكية صافية دون الحاجة للاتصال بالإنترنت</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-warm-ivory border border-border-subtle flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-muted-bronze" />
                  <span>شروق الشمس (Sunrise):</span>
                </div>
                <span className="font-mono font-bold text-sm text-warm-charcoal">{solar.sunrise}</span>
              </div>

              <div className="p-3 rounded-lg bg-warm-ivory border border-border-subtle flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-deep-olive" />
                  <span>غروب الشمس (Sunset):</span>
                </div>
                <span className="font-mono font-bold text-sm text-warm-charcoal">{solar.sunset}</span>
              </div>

              <div className="p-3 rounded-lg bg-sand-beige/30 border border-muted-bronze/40 space-y-1">
                <div className="flex justify-between items-center font-semibold text-warm-charcoal">
                  <span>الساعة الذهبية المسائية:</span>
                  <span className="font-mono text-deep-olive">
                    {solar.eveningGoldenHour.start} — {solar.eveningGoldenHour.end}
                  </span>
                </div>
                <p className="text-2xs text-text-secondary">
                  أفضل وقت لتصوير اللقطات الرومانسية المفتوحة وضوء الغروب الدافئ.
                </p>
              </div>

              <div className="pt-2 text-text-secondary leading-relaxed">
                الموقع: <strong className="text-warm-charcoal">{locationName}</strong>
                <br />
                الإحداثيات: {latitude}° N, {longitude}° E (Africa/Cairo)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
