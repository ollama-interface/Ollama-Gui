import { useEffect, useState } from "react";
import { core, syncModels } from "@/core";
import { CheckCircle2, AlertCircle, Download, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";

type OnboardingStep =
  | "welcome"
  | "checking"
  | "not-found"
  | "model-selection"
  | "complete";

interface OllamaStatus {
  installed: boolean;
  running: boolean;
  error?: string;
  path?: string;
}

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [ollamaFound, setOllamaFound] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const checkOllamaConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch("http://127.0.0.1:11434/api/tags", {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkOllama = async () => {
    setIsChecking(true);
    setStep("checking");

    try {
      let isConnected = false;
      let ollamaPath = "";

      try {
        console.log(
          "[Onboarding] Attempting to invoke check_ollama_installed...",
        );
        const status: OllamaStatus = await invoke("check_ollama_installed");
        console.log("[Onboarding] Ollama detection result:", status);

        if (status.installed) {
          ollamaPath = status.path || "";
          console.log(
            "[Onboarding] Ollama found, installed:",
            status.installed,
          );

          isConnected = status.running;
          console.log("[Onboarding] Ollama running:", isConnected);

          if (!isConnected) {
            console.log(
              "[Onboarding] Ollama not running, attempting to start...",
            );
            setIsStarting(true);
            const startStatus: OllamaStatus = await invoke(
              "start_ollama_server",
            );
            console.log("[Onboarding] Start result:", startStatus);
            setIsStarting(false);

            if (startStatus.running || startStatus.error === null) {
              console.log("[Onboarding] Waiting for server to start...");
              await new Promise((resolve) => setTimeout(resolve, 3000));
              isConnected = await checkOllamaConnection();
              console.log(
                "[Onboarding] Connection check after start:",
                isConnected,
              );
            }
          }
        } else {
          console.log("[Onboarding] Ollama not installed:", status.error);
        }
      } catch (error) {
        console.error("[Onboarding] Tauri invoke error:", error);
        console.log("[Onboarding] Falling back to connection check...");
        isConnected = await checkOllamaConnection();
      }

      if (isConnected) {
        console.log("[Onboarding] Ollama confirmed running, syncing models...");
        setOllamaFound(true);
        await syncModels();
        setStep("model-selection");
      } else {
        console.log("[Onboarding] Ollama not available");
        setOllamaFound(false);
        setStep("not-found");
      }
    } catch (error) {
      console.error("[Onboarding] Error checking Ollama:", error);
      setOllamaFound(false);
      setStep("not-found");
    } finally {
      setIsChecking(false);
      setIsStarting(false);
    }
  };

  const handleComplete = () => {
    core.introduction_finished.set(true);
    onComplete();
  };

  const openOllamaDownload = () => {
    const url = "https://ollama.ai";
    const win = window as any;
    if (win.__TAURI__) {
      win.__TAURI__.shell.open(url);
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {step === "welcome" && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Welcome! 🐐</h1>
              <p className="text-gray-600">
                Let's set up your Ollama Chat experience
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                This app requires <strong>Ollama</strong> to run AI models
                locally on your machine.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Run models completely offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>No API keys or subscriptions needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Full privacy - your data stays local</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={checkOllama}
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              {isChecking ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check for Ollama"
              )}
            </Button>
          </>
        )}

        {step === "checking" && (
          <div className="text-center space-y-4">
            <Loader className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
            <p className="text-gray-600">
              {isStarting
                ? "Starting Ollama server..."
                : "Checking for Ollama installation..."}
            </p>
          </div>
        )}

        {step === "not-found" && (
          <>
            <div className="text-center space-y-2">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Ollama Not Found
              </h2>
              <p className="text-gray-600">
                We couldn't detect Ollama on your system
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">
                Here's what you need to do:
              </p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Download Ollama from ollama.ai</li>
                <li>Install it on your machine</li>
                <li>Start the Ollama server</li>
                <li>Come back and click "Check Again"</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={openOllamaDownload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Download Ollama
              </Button>
              <Button
                onClick={checkOllama}
                variant="outline"
                className="flex-1"
              >
                Check Again
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Already installed? Make sure the Ollama server is running on your
              machine.
            </p>
          </>
        )}

        {step === "model-selection" && (
          <>
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Great! Ollama Found
              </h2>
              <p className="text-gray-600">
                You're ready to start chatting with AI models
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                You can now start using the app. If you don't have any models
                installed yet, you can download them from the Settings menu.
              </p>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
