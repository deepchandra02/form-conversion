"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  CheckCircle,
  Download,
  RotateCcw,
  FileText,
  TrendingUp,
  Database,
} from "lucide-react";

export function SuccessPage({ fileName, results, onReset }) {
  const handleDownload = async () => {
    try {
      if (results?.results?.[0]?.package_name) {
        const blob = await apiClient.downloadFile(`generated_AF/${results.results[0].package_name}.zip`);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${results.results[0].package_name}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20" />

        <div className="relative z-10">
          <div className="mb-6 relative">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/25">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            {/* Ripple effect */}
            <div className="absolute inset-0 mx-auto w-24 h-24 rounded-full border-4 border-emerald-500/30 animate-ping" />
          </div>

          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-3">
            Conversion Complete!
          </h2>

          <p className="text-lg text-muted-foreground mb-2">
            Your AF package has been successfully generated
          </p>
          <p className="text-sm text-muted-foreground/80 mb-8 font-mono bg-muted/50 px-3 py-1 rounded-md inline-block">
            {fileName}
          </p>

          {results?.results?.[0] && (
            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">{results.results[0].page_count} Pages</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <Database className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-sm font-medium">{results.results[0].num_sections} Sections</div>
                <div className="text-xs text-muted-foreground">Analyzed</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm font-medium">{results.results[0].total_tokens?.toLocaleString()} Tokens</div>
                <div className="text-xs text-muted-foreground">Used</div>
              </div>
            </div>
          )}

          {results?.global_stats && (
            <div className="mb-6 p-4 bg-muted/20 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-center">Session Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center">
                  <div className="font-medium">{results.global_stats.total_cost_all_forms?.toFixed(4)} USD</div>
                  <div className="text-muted-foreground">Total Cost</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{results.global_stats.total_pages_all_forms} Pages</div>
                  <div className="text-muted-foreground">Total Processed</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
            >
              <Download className="w-5 h-5 mr-2" />
              Download AF Package
            </Button>

            <div>
              <Button
                variant="outline"
                onClick={onReset}
                className="px-6 py-3 transition-all duration-300 hover:scale-105 bg-transparent border-2 hover:bg-muted/50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Convert Another File
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                1
              </span>
            </div>
            <div>
              <div className="font-medium">Extract the Package</div>
              <div className="text-muted-foreground">
                Unzip the downloaded AF package file
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 dark:text-green-400 font-bold text-xs">
                2
              </span>
            </div>
            <div>
              <div className="font-medium">Import to Adobe</div>
              <div className="text-muted-foreground">
                Use the structured JSON data in your workflow
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
