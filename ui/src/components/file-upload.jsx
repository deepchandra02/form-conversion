"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File } from "lucide-react"

export function FileUpload({ onFileUpload }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFileUpload(files[0])
      }
    },
    [onFileUpload],
  )

  const handleFileSelect = useCallback(
    (e) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFileUpload(files[0])
      }
    },
    [onFileUpload],
  )

  return (
    <Card
      className={`
      p-12 border-2 border-dashed transition-all duration-300 ease-in-out
      ${isDragOver ? "border-accent bg-accent/5 scale-105" : "border-border hover:border-accent/50 hover:bg-accent/5"}
    `}
    >
      <div className="text-center" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <div
          className={`
          mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300
          ${isDragOver ? "bg-accent text-accent-foreground scale-110" : "bg-muted text-muted-foreground"}
        `}
        >
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-semibold mb-2 text-foreground">Drop your file here</h3>

        <p className="text-muted-foreground mb-6">or click to browse and select a file</p>

        <div className="space-y-4">
          <input type="file" id="file-upload" className="hidden" onChange={handleFileSelect} accept="*/*" />

          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium transition-all duration-200 hover:scale-105"
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              <File className="w-5 h-5 mr-2" />
              Choose File
            </label>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-4">Supports all common file formats</p>
      </div>
    </Card>
  )
}
