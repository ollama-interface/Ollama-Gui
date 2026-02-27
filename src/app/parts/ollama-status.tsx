import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, CheckCircle2, Loader } from "lucide-react";

interface OllamaStatus {
  installed: boolean;
  running: boolean;
  error?: string;
}

export const OllamaStatusIndicator = () => {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOllamaStatus();
    const interval = setInterval(checkOllamaStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const win = window as any;
      if (win.__TAURI__) {
        const result: OllamaStatus = await invoke("check_ollama_installed");
        setStatus(result);
      }
    } catch (error) {
      console.error("Failed to check Ollama status:", error);
      setStatus({
        installed: false,
        running: false,
        error: "Failed to check status",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-2">
        <Loader size={16} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-500">Checking Ollama...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (!status.installed) {
    return (
      <div className="px-4 py-3 border-t border-gray-200 bg-red-50">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <div>
            <p className="text-xs font-medium text-red-900">Ollama Not Found</p>
            <p className="text-xs text-red-700">Install from ollama.ai</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status.running) {
    return (
      <div className="px-4 py-3 border-t border-gray-200 bg-yellow-50">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-yellow-600" />
          <div>
            <p className="text-xs font-medium text-yellow-900">Ollama Installed</p>
            <p className="text-xs text-yellow-700">Server not running</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-green-50">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-green-600" />
        <div>
          <p className="text-xs font-medium text-green-900">Ollama Ready</p>
          <p className="text-xs text-green-700">Server running</p>
        </div>
      </div>
    </div>
  );
};
