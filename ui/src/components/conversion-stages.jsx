"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Cog, CheckCircle } from "lucide-react"

const stages = [
  { id: "uploading", label: "Uploading", icon: Upload, duration: 2000 },
  { id: "processing", label: "Processing", icon: Cog, duration: 3000 },
  { id: "converting", label: "Converting", icon: Cog, duration: 2500 },
]

export function ConversionStages({ fileName, onComplete }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (currentStageIndex >= stages.length) return

    const currentStage = stages[currentStageIndex]
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const stageProgress = Math.min((elapsed / currentStage.duration) * 100, 100)
      setProgress(stageProgress)

      if (stageProgress >= 100) {
        if (currentStageIndex < stages.length - 1) {
          setTimeout(() => {
            setCurrentStageIndex((prev) => prev + 1)
            setProgress(0)
          }, 500)
        } else {
          setTimeout(() => {
            onComplete()
          }, 1000)
        }
      } else {
        requestAnimationFrame(updateProgress)
      }
    }

    updateProgress()
  }, [currentStageIndex, onComplete])

  const overallProgress = (currentStageIndex * 100 + progress) / stages.length

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Converting your file</h2>
        <p className="text-muted-foreground">{fileName}</p>
      </div>

      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-foreground font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Stage Indicators */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon
            const isActive = index === currentStageIndex
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex

            return (
              <div
                key={stage.id}
                className={`
                  flex items-center space-x-4 p-4 rounded-lg transition-all duration-500
                  ${isActive ? "bg-accent/10 border border-accent/20" : ""}
                  ${isCompleted ? "bg-muted/50" : ""}
                `}
              >
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${
                    isCompleted
                      ? "bg-accent text-accent-foreground"
                      : isActive
                        ? "bg-accent text-accent-foreground animate-pulse"
                        : "bg-muted text-muted-foreground"
                  }
                `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive ? "animate-spin" : ""}`} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`
                      font-medium transition-colors duration-300
                      ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}
                    `}
                    >
                      {stage.label}
                    </span>

                    {isCurrent && (
                      <span className="text-sm text-accent font-medium animate-pulse">{Math.round(progress)}%</span>
                    )}

                    {isCompleted && <span className="text-sm text-accent font-medium">Complete</span>}
                  </div>

                  {isCurrent && (
                    <div className="mt-2">
                      <Progress value={progress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
