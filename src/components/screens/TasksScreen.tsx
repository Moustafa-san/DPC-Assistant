"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square } from "lucide-react";

export function TasksScreen() {
  const { tasks, toggleTask } = useProjectStore();
  const [filterPhase, setFilterPhase] = useState<"all" | "pre" | "shoot" | "post">("all");

  const phases = [
    { id: "all", label: "جميع المهام" },
    { id: "pre", label: "ما قبل التصوير (Pre)" },
    { id: "shoot", label: "يوم التصوير (Shoot)" },
    { id: "post", label: "ما بعد الإنتاج (Post)" },
  ];

  const filteredTasks =
    filterPhase === "all" ? tasks : tasks.filter((t) => t.phase === filterPhase);

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">طبقة الأعمال</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">إدارة المهام (Tasks & Checklists)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            متابعة المهام التشغيلية عبر المراحل الثلاث: التجهيز، يوم التنفيذ، وما بعد التسليم.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs px-3 py-1">
          المهام المكتملة: {completedCount} من {tasks.length}
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilterPhase(p.id as unknown as "all" | "pre" | "shoot" | "post")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-touch-target cursor-pointer ${
              filterPhase === p.id
                ? "bg-deep-olive text-warm-ivory shadow-xs"
                : "text-warm-charcoal hover:bg-sand-beige/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`cursor-pointer border-border-subtle transition-all ${
              task.isCompleted ? "bg-sand-beige/20 opacity-80" : "hover:border-deep-olive"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {task.isCompleted ? (
                  <CheckSquare className="w-5 h-5 text-status-success shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-border-subtle shrink-0 hover:text-deep-olive" />
                )}
                <span className={`text-sm font-medium ${task.isCompleted ? "line-through text-text-secondary" : "text-warm-charcoal"}`}>
                  {task.title}
                </span>
              </div>
              <Badge variant="outline" className="text-2xs uppercase">
                {task.phase}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
