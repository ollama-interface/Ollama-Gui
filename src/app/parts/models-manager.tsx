import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, core, syncModels, downloadModel } from "@/core";
import { PullProgressEvent } from "@/core/utils";
import { useSimple } from "simple-core-state";
import { ModelDownloadDialog } from "./model-download-dialog";
import { ModelfileEditor } from "./modelfile-editor";
import { ChevronLeft, Download, RefreshCw, Plus } from "lucide-react";

export const ModelsManager = ({ onBack }: { onBack: () => void }) => {
  const available_models = useSimple(core.available_models);
  const last_used_model = useSimple(core.last_used_model);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadStats, setDownloadStats] = useState<{
    completed?: number;
    total?: number;
  }>({});
  const [selectedModel, setSelectedModel] = useState(last_used_model);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const refreshModels = async () => {
    try {
      await syncModels();
    } catch (error) {
      console.error("Failed to refresh models:", error);
    }
  };

  const handleDownloadModel = async (modelName: string) => {
    setDownloadingModel(modelName);
    setDownloadDialogOpen(true);
    setDownloadProgress(0);
    setDownloadStatus("Initializing...");
    setDownloadStats({});

    abortControllerRef.current = new AbortController();

    try {
      await downloadModel(
        modelName,
        (progress: PullProgressEvent) => {
          setDownloadStatus(progress.status || "Downloading...");

          if (
            progress.completed !== undefined &&
            progress.total !== undefined
          ) {
            const percent = (progress.completed / progress.total) * 100;
            setDownloadProgress(percent);
            setDownloadStats({
              completed: progress.completed,
              total: progress.total,
            });
          }
        },
        abortControllerRef.current.signal,
      );

      setDownloadProgress(100);
      setDownloadStatus("Download complete!");
      setTimeout(() => {
        setDownloadDialogOpen(false);
        refreshModels();
      }, 1500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setDownloadStatus("Download cancelled");
      } else {
        console.error("Failed to download model:", error);
        setDownloadStatus("Download failed");
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setDownloadDialogOpen(false);
    }
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    core.last_used_model.set(modelName);
  };

  const downloadableModels = [
    "llama2",
    "mistral",
    "neural-chat",
    "starling-lm",
    "dolphin-mixtral",
    "openchat",
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to chat"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Models Manager</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Model Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Active Model
            </h2>
            <div className="flex items-center gap-3">
              <Select value={selectedModel} onValueChange={handleModelSelect}>
                <SelectTrigger className="w-[300px] h-[40px] bg-white">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {available_models.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50">
                        Installed
                      </div>
                      {available_models.map((item, index) => (
                        <SelectItem
                          key={`installed-${index}`}
                          value={item.name}
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={refreshModels}
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Installed Models */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Installed ({available_models.length})
            </h2>
            {available_models.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No models installed. Download one to get started.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {available_models.map((model, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedModel === model.name
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                    onClick={() => handleModelSelect(model.name)}
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {model.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download Models */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Download Models
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {downloadableModels.map((model) => (
                <Button
                  key={model}
                  variant="outline"
                  className="h-auto py-3 px-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => handleDownloadModel(model)}
                >
                  <Download size={18} />
                  <span className="text-xs font-medium text-center">
                    {model}
                  </span>
                </Button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.open("https://ollama.ai/library")}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Browse all models on Ollama Library →
              </button>
            </div>
          </div>

          {/* Modelfile Templates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Modelfile Templates
              </h2>
              <ModelfileEditor
                onModelCreated={refreshModels}
                availableModels={available_models.map((m) => m.name)}
              />
            </div>
            <p className="text-gray-600 text-sm">
              Create and manage custom models using Modelfile templates. You can
              save, edit, and reuse templates to quickly create models with
              specific configurations.
            </p>
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      <ModelDownloadDialog
        isOpen={downloadDialogOpen}
        modelName={downloadingModel}
        isDownloading={downloadDialogOpen && downloadProgress < 100}
        progress={downloadProgress}
        status={downloadStatus}
        completed={downloadStats.completed}
        total={downloadStats.total}
        onClose={() => setDownloadDialogOpen(false)}
        onCancel={handleCancelDownload}
      />
    </div>
  );
};
