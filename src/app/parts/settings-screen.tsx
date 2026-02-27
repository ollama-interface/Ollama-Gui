import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  actions,
  core,
  downloadModel,
  deleteModel,
  PullProgressEvent,
} from "@/core";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useSimple } from "simple-core-state";
import {
  ChevronLeft,
  Server,
  Trash2,
  Database,
  Download,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { siX, siGithub } from "simple-icons";
import {
  getDatabaseStats,
  DatabaseStats,
  getDatabasePath,
  openDatabaseFile,
} from "@/core/database-actions";
import { ModelDownloadDialog } from "./model-download-dialog";

type Inputs = {
  host: string;
};

export const SettingsScreen = ({ onBack }: { onBack: () => void }) => {
  const host_url = useSimple(core.server_host);
  const available_models = useSimple(core.available_models);
  const show_metrics = useSimple(core.show_metrics);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    conversationCount: 0,
    messageCount: 0,
    totalSize: "0 items",
  });
  const [dbPath, setDbPath] = useState<string>("");
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadStats, setDownloadStats] = useState<{
    completed?: number;
    total?: number;
  }>({});
  const [deleteConfirmModel, setDeleteConfirmModel] = useState<string | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadDatabaseStats();
    loadDatabasePath();
  }, []);

  const loadDatabaseStats = async () => {
    const stats = await getDatabaseStats();
    setDbStats(stats);
  };

  const loadDatabasePath = async () => {
    const path = await getDatabasePath();
    setDbPath(path);
  };

  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useForm<Inputs>({ values: { host: host_url } });

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    core.server_host.set(data.host);
    reset({ host: data.host });
  };

  const clearDatabase = async () => {
    await actions.flushDatbase();
    core.conversations.reset();
    core.focused_conv_data.reset();
    core.focused_conv_id.reset();
    core.focused_conv_meta.reset();
    setShowClearConfirm(false);
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

  const handleDeleteModel = async (modelName: string) => {
    try {
      await deleteModel(modelName);
      setDeleteConfirmModel(null);
    } catch (error) {
      console.error("Failed to delete model:", error);
    }
  };

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
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-8">
          {/* Server Settings Section */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Server</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ollama Server Address
                </label>
                <Controller
                  name="host"
                  control={control}
                  rules={{ required: true, minLength: 1 }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder="http://127.0.0.1:11434"
                      className="w-full"
                    />
                  )}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The address where your Ollama server is running
                </p>
              </div>

              {isDirty && (
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => reset({ host: host_url })}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </section>

          {/* Data Management Section */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Data</h2>
            </div>
            <div className="space-y-4">
              {/* Database Statistics */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Database Statistics
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Conversations:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {dbStats.conversationCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Messages:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {dbStats.messageCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {dbStats.totalSize}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Path */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Database Location
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-2 text-gray-700 break-all">
                    {dbPath}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openDatabaseFile}
                    className="gap-2 shrink-0"
                    title="Open database file location"
                  >
                    <FolderOpen size={16} />
                    Open
                  </Button>
                </div>
              </div>

              {/* Clear Data Section */}
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Clear all conversations and messages from your local database.
                </p>
                {!showClearConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full"
                  >
                    Clear All Data
                  </Button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-red-900">
                      Are you sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearDatabase}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics Display Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-purple-600" />
                    <label className="text-sm font-medium text-gray-900">
                      Show Response Metrics
                    </label>
                  </div>
                  <button
                    onClick={() => core.show_metrics.set(!show_metrics)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      show_metrics ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        show_metrics ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Display performance metrics (duration, tokens, speed) below AI
                  responses
                </p>
              </div>
            </div>
          </section>

          {/* Models Manager Section */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download size={20} className="text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Models Manager
              </h2>
            </div>
            <div className="space-y-4">
              {available_models.length === 0 ? (
                <p className="text-sm text-gray-600">No models installed.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    Installed Models ({available_models.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {available_models.map((model, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {model.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                          onClick={() => setDeleteConfirmModel(model.name)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deleteConfirmModel && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-red-900">
                    Delete {deleteConfirmModel}?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteModel(deleteConfirmModel)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmModel(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Download Models
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "llama2",
                    "mistral",
                    "neural-chat",
                    "starling-lm",
                    "dolphin-mixtral",
                    "openchat",
                  ].map((model) => (
                    <Button
                      key={model}
                      size="sm"
                      variant="outline"
                      className="h-[28px] px-2 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => handleDownloadModel(model)}
                    >
                      ↓ {model}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Ollama GUI - A modern interface for Ollama
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = "https://x.com/twanluttik";
                    const win = window as any;
                    if (win.__TAURI__) {
                      win.__TAURI__.shell.open(url);
                    } else {
                      window.open(url, "_blank");
                    }
                  }}
                  className="flex-1 gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    dangerouslySetInnerHTML={{ __html: siX.svg }}
                  />
                  Author
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url =
                      "https://github.com/ollama-interface/Ollama-Gui";
                    const win = window as any;
                    if (win.__TAURI__) {
                      win.__TAURI__.shell.open(url);
                    } else {
                      window.open(url, "_blank");
                    }
                  }}
                  className="flex-1 gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    dangerouslySetInnerHTML={{ __html: siGithub.svg }}
                  />
                  GitHub
                </Button>
              </div>
            </div>
          </section>
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
