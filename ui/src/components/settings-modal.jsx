"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"

export function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    tNumber: "",
    endpoint: "",
    apiKey: "",
    version: "",
    modelName: "",
    packagerMode: "sandbox",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [hasExistingData, setHasExistingData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load settings from backend on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const configData = await apiClient.checkConfig()

      if (configData.config_exists && configData.secrets_exists) {
        setSettings({
          tNumber: configData.secrets.T_NUMBER || "",
          endpoint: configData.secrets.AZURE_OPENAI_ENDPOINT || "",
          apiKey: configData.secrets.AZURE_OPENAI_API_KEY || "",
          version: configData.secrets.API_VERSION || "",
          modelName: configData.secrets.MODEL_NAME || "",
          packagerMode: configData.config.packager_mode || "sandbox",
        })
        setHasExistingData(true)
      } else {
        setIsEditing(true)
      }
    } catch (err) {
      setError("Failed to load configuration")
      setIsEditing(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const requiredFields = [
      { key: 'tNumber', label: 'T-Number' },
      { key: 'endpoint', label: 'Endpoint' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'version', label: 'Version' },
      { key: 'modelName', label: 'Model Name' }
    ]

    const emptyFields = requiredFields.filter(field => !settings[field.key]?.trim())

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(field => field.label).join(', ')
      return `Please fill in all required fields: ${fieldNames}`
    }

    // Validate endpoint URL format
    if (settings.endpoint && !settings.endpoint.match(/^https?:\/\/.+/)) {
      return 'Endpoint must be a valid URL starting with http:// or https://'
    }

    // Validate T-Number format (should start with 'T' followed by numbers)
    if (settings.tNumber && !settings.tNumber.match(/^T\d+$/i)) {
      return 'T-Number must start with "T" followed by numbers (e.g., T12345)'
    }

    return null
  }

  const handleSave = async () => {
    try {
      setError(null)

      // Validate form before saving
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      setIsSaving(true)
      await apiClient.saveConfig(settings)

      setHasExistingData(true)
      setIsEditing(false)
      onClose()
    } catch (err) {
      setError("Failed to save configuration: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleClose = () => {
    // Reset to saved state if editing was cancelled
    if (isEditing && hasExistingData) {
      loadSettings()
    }
    setIsEditing(false)
    setError(null)
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
          {(!hasExistingData || isEditing) && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="text-destructive">*</span> All fields are required for the conversion process to work properly.
              </p>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading configuration...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        {!isLoading && (
          <div className="space-y-4">
          <div>
            <Label htmlFor="tNumber" className="text-sm font-medium">
              T-Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tNumber"
              value={settings.tNumber}
              onChange={(e) => handleInputChange("tNumber", e.target.value)}
              disabled={isFormDisabled}
              placeholder="e.g., T12345"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="endpoint" className="text-sm font-medium">
              Endpoint <span className="text-destructive">*</span>
            </Label>
            <Input
              id="endpoint"
              value={settings.endpoint}
              onChange={(e) => handleInputChange("endpoint", e.target.value)}
              disabled={isFormDisabled}
              placeholder="https://your-endpoint.openai.azure.com/"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="apiKey" className="text-sm font-medium">
              API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleInputChange("apiKey", e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter your Azure OpenAI API key"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="version" className="text-sm font-medium">
              API Version <span className="text-destructive">*</span>
            </Label>
            <Input
              id="version"
              value={settings.version}
              onChange={(e) => handleInputChange("version", e.target.value)}
              disabled={isFormDisabled}
              placeholder="e.g., 2024-02-01"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="modelName" className="text-sm font-medium">
              Model Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modelName"
              value={settings.modelName}
              onChange={(e) => handleInputChange("modelName", e.target.value)}
              disabled={isFormDisabled}
              placeholder="e.g., gpt-4"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="packagerMode" className="text-sm font-medium">
              Packager Mode
            </Label>
            <Select
              value={settings.packagerMode}
              onValueChange={(value) => handleInputChange("packagerMode", value)}
              disabled={isFormDisabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select packager mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="dev">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        )}

        {/* Buttons */}
        {!isLoading && (
          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleSave}
              className="flex-1 cursor-pointer"
              disabled={isSaving || isFormDisabled}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {hasExistingData && !isEditing ? 'Update Configuration' : 'Save Configuration'}
            </Button>
            {hasExistingData && !isEditing && (
              <Button onClick={handleEdit} variant="outline" className="flex-1 bg-transparent cursor-pointer hover:bg-black">
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
