"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "./components/file-upload";
import { ConversionStages } from "./components/conversion-stages";
import { SuccessPage } from "./components/success-page";
import { SettingsModal } from "./components/settings-modal";
import { Settings, Sun, Moon } from "lucide-react";
import "./globals.css";
import logo from "./assets/logo.svg";

export default function App() {
  const [currentStage, setCurrentStage] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [conversionResults, setConversionResults] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsSpinning, setIsSettingsSpinning] = useState(false);
  const [configRefreshKey, setConfigRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setCurrentStage("converting");
  };

  const handleConversionComplete = (results) => {
    setConversionResults(results);
    setCurrentStage("success");
  };

  const handleConversionError = () => {
    setCurrentStage("upload");
  };

  const handleReset = () => {
    setCurrentStage("upload");
    setUploadedFile(null);
    setConversionResults(null);
  };

  const handleSettingsClick = () => {
    setIsSettingsSpinning(true);
    setTimeout(() => {
      setIsSettingsOpen(true);
      setIsSettingsSpinning(false);
    }, 300);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    // Refresh configuration check after settings are closed
    setConfigRefreshKey(prev => prev + 1);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="FileConverter Logo"
              className="w-8 h-8 text-primary"
            />
            <span className="font-semibold text-foreground">FileConverter</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </button>

            <button
              onClick={handleSettingsClick}
              className={`cursor-pointer p-2 rounded-lg hover:bg-accent transition-all duration-200 ${
                isSettingsSpinning ? "animate-spin" : ""
              }`}
            >
              <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            File Converter
          </h1>
          <p className="text-muted-foreground text-lg">
            Convert your files effortlessly
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {currentStage === "upload" && (
            <FileUpload
              key={configRefreshKey}
              onFileUpload={handleFileUpload}
              onOpenSettings={handleOpenSettings}
            />
          )}

          {currentStage === "converting" && (
            <ConversionStages
              fileName={uploadedFile?.name || ""}
              file={uploadedFile}
              onComplete={handleConversionComplete}
              onError={handleConversionError}
            />
          )}

          {currentStage === "success" && (
            <SuccessPage
              fileName={uploadedFile?.name || ""}
              results={conversionResults}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </div>
  );
}
