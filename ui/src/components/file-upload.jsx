"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  File,
  AlertCircle,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api";

export function FileUpload({ onFileUpload, onOpenSettings }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      setIsCheckingConfig(true);
      const configData = await apiClient.checkConfig();
      setIsConfigured(configData.config_exists && configData.secrets_exists);
    } catch {
      setError("Failed to check configuration");
      setIsConfigured(false);
    } finally {
      setIsCheckingConfig(false);
    }
  };

  const validateFile = (file) => {
    // Check if file is PDF
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are supported";
    }

    // Check filename format (first 4 characters should be alphabetic)
    const name = file.name.split(".")[0];
    if (name.length < 4 || !name.substring(0, 4).match(/^[A-Za-z]+$/)) {
      return "PDF filename must start with at least 4 alphabetic characters (e.g., ABCD_form.pdf)";
    }

    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      return "File size must be less than 100MB";
    }

    return null;
  };

  const handleFileAction = useCallback(
    (file) => {
      if (!isConfigured) {
        onOpenSettings();
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      onFileUpload(file);
    },
    [isConfigured, onOpenSettings, onFileUpload]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      setError(null);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileAction(files[0]);
      }
    },
    [handleFileAction]
  );

  const handleFileSelect = useCallback(
    (e) => {
      setError(null);
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFileAction(files[0]);
      }
    },
    [handleFileAction]
  );

  return (
    <Card
      className={`
      p-12 border-2 border-dashed transition-all duration-300 ease-in-out
      ${
        isDragOver
          ? "border-accent bg-accent/5 scale-105"
          : "border-border hover:border-accent/50 hover:bg-accent/5"
      }
    `}
    >
      <div
        className="text-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={`
          mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300
          ${
            isDragOver
              ? "bg-accent text-accent-foreground scale-110"
              : "bg-muted text-muted-foreground"
          }
        `}
        >
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-semibold mb-2 text-foreground">
          Drop your file here
        </h3>

        <p className="text-muted-foreground mb-6">
          or click to browse and select a file
        </p>

        {isCheckingConfig ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">
              Checking configuration...
            </span>
          </div>
        ) : !isConfigured ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2 justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Configuration Required
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please configure your API settings before uploading files.
              </p>
            </div>

            <Button
              onClick={onOpenSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configure Settings
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf"
            />

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
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          PDF files only. Filename must start with form-code (e.g.,
          ABCD_form.pdf)
        </p>
      </div>
    </Card>
  );
}
