"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { analyzePalette } from "@/lib/palette/lut-generator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Sliders, Check } from "lucide-react";

export function PaletteScreen() {
  const { palette, setPaletteColors, exportLutCube } = useProjectStore();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const analysis = analyzePalette(palette);

  const handleDownloadCube = () => {
    const cubeContent = exportLutCube();
    const blob = new Blob([cubeContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${palette.name.replace(/\s+/g, "_")}.cube`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 5</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">لوحة الألوان السينمائية (Cine Palette)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            تصميم التناسق اللوني السينمائي (قاعدة 60/30/10) وتصدير ملفات 3D LUT (.cube) القياسية لمونتاج الفيديو.
          </p>
        </div>

        <Button onClick={handleDownloadCube} className="gap-2 shrink-0">
          {downloadSuccess ? <Check className="w-4 h-4 text-status-success" /> : <Download className="w-4 h-4" />}
          <span>{downloadSuccess ? "تم تنزيل ملف .cube!" : "تصدير ملف 3D LUT (.cube)"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 60/30/10 Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">توزيع نسب الألوان السينمائية (60 / 30 / 10 Harmony)</CardTitle>
              <CardDescription>
                توزيع إرشادي للعين البشرية: 60% للبيئة العامة، 30% للموضوع والملابس، 10% للمسات والإضاءات الجانبية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual Strip */}
              <div className="h-28 rounded-xl overflow-hidden flex shadow-inner border border-border-subtle">
                <div
                  style={{ width: "60%", backgroundColor: palette.dominantColor }}
                  className="h-full flex flex-col justify-end p-3 text-xs font-semibold"
                >
                  <span className="backdrop-blur-md bg-warm-charcoal/20 px-2 py-1 rounded text-warm-ivory w-fit">
                    60% الأساس ({palette.dominantColor})
                  </span>
                </div>
                <div
                  style={{ width: "30%", backgroundColor: palette.secondaryColor }}
                  className="h-full flex flex-col justify-end p-3 text-xs font-semibold"
                >
                  <span className="backdrop-blur-md bg-warm-charcoal/20 px-2 py-1 rounded text-warm-ivory w-fit">
                    30% الثانوي ({palette.secondaryColor})
                  </span>
                </div>
                <div
                  style={{ width: "10%", backgroundColor: palette.accentColor }}
                  className="h-full flex flex-col justify-end p-2 text-2xs font-semibold"
                >
                  <span className="backdrop-blur-md bg-warm-charcoal/30 px-1 py-0.5 rounded text-warm-ivory w-fit truncate">
                    10%
                  </span>
                </div>
              </div>

              {/* Color Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-warm-ivory rounded-lg border border-border-subtle space-y-2">
                  <label className="text-xs font-bold text-warm-charcoal block">
                    اللون الأساسي 60% (Dominant)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={palette.dominantColor}
                      onChange={(e) =>
                        setPaletteColors(e.target.value, palette.secondaryColor, palette.accentColor)
                      }
                      className="w-10 h-10 rounded border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={palette.dominantColor}
                      onChange={(e) =>
                        setPaletteColors(e.target.value, palette.secondaryColor, palette.accentColor)
                      }
                      className="w-full text-xs font-mono uppercase p-2 rounded border border-border-subtle bg-soft-ivory"
                    />
                  </div>
                  <span className="text-2xs text-text-secondary block">الخلفيات، الجدران، والأجواء العامة</span>
                </div>

                <div className="p-3 bg-warm-ivory rounded-lg border border-border-subtle space-y-2">
                  <label className="text-xs font-bold text-warm-charcoal block">
                    اللون الثانوي 30% (Secondary)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={palette.secondaryColor}
                      onChange={(e) =>
                        setPaletteColors(palette.dominantColor, e.target.value, palette.accentColor)
                      }
                      className="w-10 h-10 rounded border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={palette.secondaryColor}
                      onChange={(e) =>
                        setPaletteColors(palette.dominantColor, e.target.value, palette.accentColor)
                      }
                      className="w-full text-xs font-mono uppercase p-2 rounded border border-border-subtle bg-soft-ivory"
                    />
                  </div>
                  <span className="text-2xs text-text-secondary block">ملابس الأشخاص وعناصر المقدمة</span>
                </div>

                <div className="p-3 bg-warm-ivory rounded-lg border border-border-subtle space-y-2">
                  <label className="text-xs font-bold text-warm-charcoal block">
                    لون اللمسة 10% (Accent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={palette.accentColor}
                      onChange={(e) =>
                        setPaletteColors(palette.dominantColor, palette.secondaryColor, e.target.value)
                      }
                      className="w-10 h-10 rounded border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={palette.accentColor}
                      onChange={(e) =>
                        setPaletteColors(palette.dominantColor, palette.secondaryColor, e.target.value)
                      }
                      className="w-full text-xs font-mono uppercase p-2 rounded border border-border-subtle bg-soft-ivory"
                    />
                  </div>
                  <span className="text-2xs text-text-secondary block">المجوهرات، الإكسسوارات، والـ Rim Light</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical LUT Export Specs */}
        <div className="space-y-6">
          <Card className="bg-soft-ivory border-deep-olive/20">
            <CardHeader>
              <div className="flex items-center gap-2 text-deep-olive">
                <Sliders className="w-5 h-5" />
                <CardTitle className="text-lg">مواصفات تصدير 3D LUT</CardTitle>
              </div>
              <CardDescription>متوافق مع DaVinci Resolve وPremiere Pro وFinal Cut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">صيغة الملف:</span>
                <span className="font-mono font-bold">Adobe .cube (3D)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">حجم المصفوفة (LUT_3D_SIZE):</span>
                <span className="font-mono font-bold">17 × 17 × 17 (4,913 نقطة)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">نطاق السطوع (Luminance):</span>
                <span className="font-mono">
                  {analysis.luminance.dominant} / {analysis.luminance.secondary}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">اتجاه الألوان:</span>
                <span className="font-semibold text-deep-olive">Warm Golden Editorial</span>
              </div>

              <div className="pt-2 text-text-secondary leading-relaxed">
                يتم توليد ملف الـ LUT بمعادلات رياضية صافية تطبق منحنى تباين سينمائي وتدرج حراري يسحب إضاءات المشهد نحو لوحة الألوان المحددة.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
