"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api";
import {
  Upload,
  FileImage,
  Scissors,
  Code,
  Brain,
  Package,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export function ConversionStages({ fileName, file, onComplete, onError }) {
  const [sessionId, setSessionId] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let pollInterval;

    const startConversion = async () => {
      if (hasStarted) {
        return;
      }

      try {
        setHasStarted(true);
        setIsProcessing(true);

        // Upload file
        const uploadResult = await apiClient.uploadFiles(file, 'single');
        setSessionId(uploadResult.session_id);

        // Start processing
        await apiClient.startProcessing(uploadResult.session_id);

        // Poll for progress
        pollInterval = setInterval(async () => {
          try {
            const progress = await apiClient.getProgress(uploadResult.session_id);
            setProgressData(progress);

            if (progress.status === 'completed') {
              clearInterval(pollInterval);
              setIsProcessing(false);
              onComplete(progress);
            } else if (progress.status === 'error') {
              clearInterval(pollInterval);
              setIsProcessing(false);
              setError(progress.error_message || 'An error occurred during processing');
              onError(progress.error_message || 'An error occurred during processing');
            }
          } catch (err) {
            console.error('Error polling progress:', err);
            // Continue polling on error unless it's a critical error
          }
        }, 1000); // Poll every second

      } catch (err) {
        setError(err.message);
        setIsProcessing(false);
        setHasStarted(false);
        onError(err.message);
      }
    };

    if (file && !hasStarted) {
      startConversion();
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [file, fileName, hasStarted, onComplete, onError]);

  if (error) {
    return (
      <Card className="p-8 backdrop-blur-sm bg-card/95 border-border/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Processing Failed
          </h2>
          <p className="text-muted-foreground mb-4">{fileName}</p>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!progressData && isProcessing) {
    return (
      <Card className="p-8 backdrop-blur-sm bg-card/95 border-border/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Initializing...
          </h2>
          <p className="text-muted-foreground">Uploading {fileName}</p>
        </div>
      </Card>
    );
  }

  if (!progressData) return null;

  const currentStepIndex = progressData.current_step || 0;
  const overallProgress = progressData.progress || 0;
  const steps = progressData.steps || [];

  return (
    <Card className="p-8 backdrop-blur-sm bg-card/95 border-border/50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-foreground">
          Converting your file
        </h2>
        <p className="text-muted-foreground">{fileName}</p>
        {progressData.elapsed_time && (
          <p className="text-sm text-muted-foreground mt-1">
            Elapsed time: {Math.floor(progressData.elapsed_time / 60)}:{(progressData.elapsed_time % 60).toString().padStart(2, '0')}
          </p>
        )}
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

        {/* Step Indicators */}
        <div className="space-y-3">
          {steps.map((stepLabel, index) => {
            const icons = [Upload, FileImage, Scissors, Code, Brain, Package, CheckCircle];
            const Icon = icons[index] || Upload;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div
                key={index}
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
                      {stepLabel}
                    </span>

                    {isCompleted && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                        Complete
                      </span>
                    )}

                    {isActive && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse ml-2">
                        Processing...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
