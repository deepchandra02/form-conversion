"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    tNumber: "",
    endpoint: "",
    apiKey: "",
    version: "",
    modelName: "",
    deploymentName: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [hasExistingData, setHasExistingData] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("converterSettings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      setHasExistingData(true)
    }
  }, [])

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    localStorage.setItem("converterSettings", JSON.stringify(settings))
    setHasExistingData(true)
    setIsEditing(false)
    onClose()
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleClose = () => {
    // Reset to saved state if editing was cancelled
    if (isEditing && hasExistingData) {
      const savedSettings = localStorage.getItem("converterSettings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    }
    setIsEditing(false)
    onClose()
  }

  if (!isOpen) return null

  const isFormDisabled = hasExistingData && !isEditing

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-white" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your conversion parameters</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="tNumber" className="text-sm font-medium">
              T-Number
            </Label>
            <Input
              id="tNumber"
              value={settings.tNumber}
              onChange={(e) => handleInputChange("tNumber", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter T-Number"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="endpoint" className="text-sm font-medium">
              Endpoint
            </Label>
            <Input
              id="endpoint"
              value={settings.endpoint}
              onChange={(e) => handleInputChange("endpoint", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter endpoint URL"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="apiKey" className="text-sm font-medium">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleInputChange("apiKey", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter API key"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="version" className="text-sm font-medium">
              Version
            </Label>
            <Input
              id="version"
              value={settings.version}
              onChange={(e) => handleInputChange("version", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter version"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="modelName" className="text-sm font-medium">
              Model Name
            </Label>
            <Input
              id="modelName"
              value={settings.modelName}
              onChange={(e) => handleInputChange("modelName", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter model name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="deploymentName" className="text-sm font-medium">
              Deployment Name
            </Label>
            <Input
              id="deploymentName"
              value={settings.deploymentName}
              onChange={(e) => handleInputChange("deploymentName", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter deployment name"
              className="mt-1"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex-1 cursor-pointer">
            Save
          </Button>
          {hasExistingData && !isEditing && (
            <Button onClick={handleEdit} variant="outline" className="flex-1 bg-transparent cursor-pointer hover:bg-black">
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
