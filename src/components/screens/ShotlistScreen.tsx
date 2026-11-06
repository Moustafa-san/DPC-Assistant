"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, CheckSquare, Square, PackageCheck } from "lucide-react";

export function ShotlistScreen() {
  const { shots, gearPackingList, toggleShotCompleted, toggleGearPacked } = useProjectStore();
  const [filterScene, setFilterScene] = useState<string>("all");

  const completedShotsCount = shots.filter((s) => s.isCompleted).length;
  const packedGearCount = gearPackingList.filter((g) => g.isPacked).length;

  const scenes = ["all", ...Array.from(new Set(shots.map((s) => s.sceneNumber)))];

  const filteredShots =
    filterScene === "all" ? shots : shots.filter((s) => s.sceneNumber === filterScene);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 3</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">قائمة اللقطات والمعدات (Pro Shotlist)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            تنظيم اللقطات حسب المشاهد والعدسات، وجرد معدات التصوير مع العمل الميداني 100% دون اتصال.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <span>اللقطات المنجزة:</span>
            <span className="font-bold text-deep-olive font-mono">{completedShotsCount} / {shots.length}</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <span>المعدات المجهزة:</span>
            <span className="font-bold text-deep-olive font-mono">{packedGearCount} / {gearPackingList.length}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shots Organizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-deep-olive" />
              <h3 className="font-bold text-lg text-warm-charcoal font-alexandria">جدول اللقطات الميدانية</h3>
            </div>
            {/* Scene Filter Tabs */}
            <div className="flex gap-1.5 bg-sand-beige/40 p-1 rounded-lg">
              {scenes.map((scene) => (
                <button
                  key={scene}
                  onClick={() => setFilterScene(scene)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    filterScene === scene
                      ? "bg-deep-olive text-warm-ivory shadow-xs"
                      : "text-warm-charcoal hover:text-deep-olive"
                  }`}
                >
                  {scene === "all" ? "كافة المشاهد" : scene}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredShots.map((shot) => (
              <Card
                key={shot.id}
                onClick={() => toggleShotCompleted(shot.id)}
                className={`cursor-pointer transition-all border-border-subtle ${
                  shot.isCompleted ? "bg-sand-beige/20 opacity-80" : "hover:border-deep-olive"
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3.5">
                  <div className="pt-0.5 text-deep-olive">
                    {shot.isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-status-success" />
                    ) : (
                      <Square className="w-5 h-5 text-border-subtle hover:text-deep-olive" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sand-beige text-warm-charcoal">
                          {shot.shotNumber}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">{shot.sceneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs font-mono">{shot.lens}</Badge>
                        <Badge variant="secondary" className="text-xs">{shot.framing}</Badge>
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${shot.isCompleted ? "line-through text-text-secondary" : "text-warm-charcoal"}`}>
                      {shot.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Gear Packing Checklist */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-muted-bronze" />
            <h3 className="font-bold text-lg text-warm-charcoal font-alexandria">جرد حقائب ومعدات التصوير</h3>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">تجهيز المعدات قبل التحرك</CardTitle>
              <CardDescription>فحص الكاميرات، العدسات، البطاقات، والإضاءة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {gearPackingList.map((gear) => (
                <div
                  key={gear.id}
                  onClick={() => toggleGearPacked(gear.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                    gear.isPacked
                      ? "bg-status-success-bg/40 border-status-success/30 text-warm-charcoal"
                      : "bg-warm-ivory border-border-subtle hover:border-deep-olive"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {gear.isPacked ? (
                      <CheckSquare className="w-4 h-4 text-status-success shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-border-subtle shrink-0" />
                    )}
                    <span className={gear.isPacked ? "line-through text-text-secondary" : ""}>
                      {gear.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-2xs capitalize">
                    {gear.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
