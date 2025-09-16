"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileImage,
  Scissors,
  Code,
  Brain,
  Package,
  CheckCircle,
} from "lucide-react";

const stages = [
  {
    id: "initialize",
    label: "Initialize Form Structure",
    icon: Upload,
    duration: 1500,
  },
  {
    id: "pdf-to-images",
    label: "PDF to Images Conversion",
    icon: FileImage,
    duration: 2500,
  },
  {
    id: "segmentation",
    label: "Image Segmentation",
    icon: Scissors,
    duration: 2000,
  },
  {
    id: "extract-code",
    label: "Extract Form Code",
    icon: Code,
    duration: 1800,
  },
  {
    id: "process-sections",
    label: "AI Processing Sections",
    icon: Brain,
    duration: 3500,
  },
  {
    id: "generate-package",
    label: "Generate AF Package",
    icon: Package,
    duration: 2200,
  },
];

export function ConversionStages({ fileName, onComplete }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStageIndex >= stages.length) return;

    const currentStage = stages[currentStageIndex];
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const stageProgress = Math.min(
        (elapsed / currentStage.duration) * 100,
        100
      );
      setProgress(stageProgress);

      if (stageProgress >= 100) {
        if (currentStageIndex < stages.length - 1) {
          setTimeout(() => {
            setCurrentStageIndex((prev) => prev + 1);
            setProgress(0);
          }, 300); // Reduced delay for smoother transitions
        } else {
          setTimeout(() => {
            onComplete();
          }, 800);
        }
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
  }, [currentStageIndex, onComplete]);

  const overallProgress = (currentStageIndex * 100 + progress) / stages.length;

  return (
    <Card className="p-8 backdrop-blur-sm bg-card/95 border-border/50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-foreground">
          Converting your file
        </h2>
        <p className="text-muted-foreground">{fileName}</p>
      </div>

      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-foreground font-medium">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={overallProgress} className="h-3 bg-muted/50" />
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isUpcoming = index > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`
                  flex items-center space-x-4 p-4 rounded-xl transition-all duration-700 ease-out transform
                  ${
                    isActive
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 scale-[1.02] shadow-lg shadow-emerald-500/10"
                      : ""
                  }
                  ${isCompleted ? "bg-muted/30 border border-muted/50" : ""}
                  ${isUpcoming ? "opacity-60 scale-95" : ""}
                  hover:scale-[1.01] cursor-default
                `}
              >
                <div
                  className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 ease-out relative overflow-hidden
                  ${
                    isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                      : isActive
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-muted/80 text-muted-foreground border border-muted/50"
                  }
                `}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  )}

                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 animate-in zoom-in duration-500" />
                  ) : (
                    <Icon
                      className={`w-6 h-6 transition-transform duration-500 ${
                        isActive ? "animate-pulse scale-110" : ""
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`
                      font-medium transition-all duration-500 truncate
                      ${
                        isActive || isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                      ${
                        isActive ? "text-emerald-700 dark:text-emerald-300" : ""
                      }
                    `}
                    >
                      {stage.label}
                    </span>

                    {isCurrent && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse ml-2">
                        {Math.round(progress)}%
                      </span>
                    )}

                    {isCompleted && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                        Complete
                      </span>
                    )}
                  </div>

                  {isCurrent && (
                    <div className="mt-3">
                      <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
