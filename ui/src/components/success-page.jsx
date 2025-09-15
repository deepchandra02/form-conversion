"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, RotateCcw } from "lucide-react"

export function SuccessPage({ fileName, onReset }) {
  const handleDownload = () => {
    // Simulate download - in a real app, this would trigger the actual download
    const link = document.createElement("a")
    link.href = "#"
    link.download = `converted-${fileName}`
    link.click()
  }

  return (
    <Card className="p-8 text-center">
      <div className="animate-bounce mb-6">
        <div className="mx-auto w-20 h-20 bg-accent rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-accent-foreground" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-foreground mb-2">Conversion Complete!</h2>

      <p className="text-muted-foreground mb-2">Your file has been successfully converted</p>

      <p className="text-sm text-muted-foreground mb-8">{fileName}</p>

      <div className="space-y-4">
        <Button
          onClick={handleDownload}
          className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg font-medium transition-all duration-200 hover:scale-105"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Converted File
        </Button>

        <div>
          <Button
            variant="outline"
            onClick={onReset}
            className="px-6 py-2 transition-all duration-200 hover:scale-105 bg-transparent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Convert Another File
          </Button>
        </div>
      </div>
    </Card>
  )
}
