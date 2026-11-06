"use client";

import React from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { calculateStorage } from "@/lib/storage-calc/calculator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Image as ImageIcon, ShieldAlert, Cpu } from "lucide-react";

export function StorageScreen() {
  const {
    videoHours,
    videoBitrateMbps,
    photoCount,
    photoAverageSizeMB,
    safetyMarginPercentage,
    cameraCount,
    setStorageInputs,
  } = useProjectStore();

  const result = calculateStorage({
    videoHours,
    videoBitrateMbps,
    photoCount,
    photoAverageSizeMB,
    safetyMarginPercentage,
    cameraCount,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 4</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">حاسبة وسائط التخزين (Storage Calculator)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            حساب دقيق لمساحات الفيديو والصور الخام بالجيجابايت العشري القياسي مع توزيع كروت الذاكرة.
          </p>
        </div>

        <Badge variant="bronze" className="text-sm px-3 py-1 font-mono">
          إجمالي السعة المطلوبة: {result.totalRequiredStorageGb} GB
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-deep-olive">
                <Video className="w-5 h-5" />
                <CardTitle className="text-lg">إعدادات تسجيل الفيديو (Video Parameters)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    ساعات التسجيل الإجمالية:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={videoHours}
                    onChange={(e) => setStorageInputs({ videoHours: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    معدل البث (Bitrate Mbps):
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={videoBitrateMbps}
                    onChange={(e) => setStorageInputs({ videoBitrateMbps: parseFloat(e.target.value) || 50 })}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm font-mono"
                  />
                  <span className="text-2xs text-text-secondary">50 Mbps (4K H.265 قياسي)</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    عدد الكاميرات الفعالة:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cameraCount}
                    onChange={(e) => setStorageInputs({ cameraCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-bronze">
                <ImageIcon className="w-5 h-5" />
                <CardTitle className="text-lg">إعدادات التصوير الفوتوغرافي (Photo Parameters)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    العدد المتوقع للقطات RAW:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={photoCount}
                    onChange={(e) => setStorageInputs({ photoCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    متوسط حجم ملف الصورة (MB):
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={photoAverageSizeMB}
                    onChange={(e) => setStorageInputs({ photoAverageSizeMB: parseFloat(e.target.value) || 55 })}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm font-mono"
                  />
                  <span className="text-2xs text-text-secondary">55 MB (45MP RAW مضغوط)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-deep-olive">
                <ShieldAlert className="w-5 h-5" />
                <CardTitle className="text-lg">هامش أمان وسائط التخزين</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>نسبة الأمان الاحتياطية:</span>
                <span className="font-bold text-deep-olive font-mono">{safetyMarginPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={safetyMarginPercentage}
                onChange={(e) => setStorageInputs({ safetyMarginPercentage: parseInt(e.target.value, 10) || 15 })}
                className="w-full accent-deep-olive cursor-pointer"
              />
            </CardContent>
          </Card>
        </div>

        {/* Results & Memory Cards Summary */}
        <div className="space-y-6">
          <Card className="bg-soft-ivory border-deep-olive/20">
            <CardHeader>
              <CardTitle className="text-lg">تفصيل السعات التخزينية</CardTitle>
              <CardDescription>وفق معيار التخزين العشري (1 GB = 1,000 MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">سعة الفيديو ({cameraCount} كاميرا):</span>
                <span className="font-mono font-semibold">{result.videoStorageGb} GB</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">سعة الصور الفوتوغرافية:</span>
                <span className="font-mono font-semibold">{result.photoStorageGb} GB</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">السعة الأساسية:</span>
                <span className="font-mono font-semibold">{result.baseStorageGb} GB</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                <span className="text-text-secondary">هامش الأمان ({safetyMarginPercentage}%):</span>
                <span className="font-mono font-semibold text-deep-olive">+{result.safetyMarginGb} GB</span>
              </div>
              <div className="pt-2 flex justify-between items-center font-bold text-base text-deep-olive">
                <span>الإجمالي المطلوب:</span>
                <span className="text-xl font-mono font-alexandria">{result.totalRequiredStorageGb} GB</span>
              </div>
            </CardContent>
          </Card>

          {/* Cards Kit Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-bronze">
                <Cpu className="w-5 h-5" />
                <CardTitle className="text-base">توزيع كروت الذاكرة الموصى بها</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-warm-ivory rounded-lg border border-border-subtle flex justify-between items-center">
                <span>كروت 512 GB:</span>
                <span className="font-bold font-mono text-sm text-deep-olive">
                  {result.recommendedCards.cards512Gb} كارت
                </span>
              </div>
              <div className="p-2.5 bg-warm-ivory rounded-lg border border-border-subtle flex justify-between items-center">
                <span>كروت 256 GB:</span>
                <span className="font-bold font-mono text-sm text-deep-olive">
                  {result.recommendedCards.cards256Gb} كارت
                </span>
              </div>
              <div className="p-2.5 bg-warm-ivory rounded-lg border border-border-subtle flex justify-between items-center">
                <span>كروت 128 GB:</span>
                <span className="font-bold font-mono text-sm text-deep-olive">
                  {result.recommendedCards.cards128Gb} كارت
                </span>
              </div>
              <div className="pt-2 text-center text-text-secondary">
                إجمالي سعة الحقيبة: <strong className="text-warm-charcoal font-mono">{result.recommendedCards.totalKitCapacityGb} GB</strong>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
