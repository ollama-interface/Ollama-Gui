import { useEffect, useState } from "react";
import { actions, core, syncModels } from "@/core";
import { loadDB } from "@/core/local-database";
import { Sidebar } from "@/app/parts/sidebar";
import { ChatWindow } from "./parts/chat-window";
import { ModelsManager } from "./parts/models-manager";
import { SettingsScreen } from "./parts/settings-screen";
import { ToolCallingScreen } from "./parts/tool-calling-screen";
import { SettingsWrapper } from "./parts/settings-wrapper";
import { Onboarding } from "./parts/onboarding";
import { useSimple } from "simple-core-state";
import { Tool } from "@/core/types";

// Load the database on the app frame
loadDB();

type ViewType = "chat" | "models" | "settings" | "toolcalling";

export const AppFrame = () => {
  const introduction_finished = useSimple(core.introduction_finished);
  const [showOnboarding, setShowOnboarding] = useState(!introduction_finished);
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);

  const loadAppData = async () => {
    try {
      // Load available models
      await syncModels();
    } catch (error) {
      console.error("Failed to sync models:", error);
    }

    try {
      // Get all conversations from the db
      const res = await actions.getConversations();
      core.conversations.set(res as any);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  useEffect(() => {
    // Load app data in order for functionality
    loadAppData();
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <SettingsWrapper>
      <div className="flex flex-row h-full w-full overflow-hidden rounded-xl relative">
        <Sidebar
          onManageModels={() => setCurrentView("models")}
          onSettings={() => setCurrentView("settings")}
          onToolCalling={() => setCurrentView("toolcalling")}
          onCloseModals={() => setCurrentView("chat")}
        />
        <div className="flex flex-col w-full">
          {currentView === "chat" && <ChatWindow />}
          {currentView === "models" && (
            <ModelsManager onBack={() => setCurrentView("chat")} />
          )}
          {currentView === "settings" && (
            <SettingsScreen onBack={() => setCurrentView("chat")} />
          )}
          {currentView === "toolcalling" && (
            <ToolCallingScreen
              onBack={() => setCurrentView("chat")}
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
            />
          )}
        </div>
      </div>
    </SettingsWrapper>
  );
};
