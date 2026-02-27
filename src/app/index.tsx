import { useEffect } from "react";
import { actions, core, syncModels } from "@/core";
import { loadDB } from "@/core/local-database";
import { Sidebar } from "@/app/parts/sidebar";
import { ChatWindow } from "./parts/chat-window";
import { SettingsWrapper } from "./parts/settings-wrapper";

// Load the database on the app frame
loadDB();

export const AppFrame = () => {
  // async function startServer() {
  //   let result = await Command.create("ollama-server", [
  //     "-c",
  //     "OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11434 ollama serve",
  //   ]).execute();
  //   console.log(result);
  // }

  const loadAppData = async () => {
    // Load available models
    syncModels();

    // Get all conversations from the db
    const res = await actions.getConversations();
    core.conversations.set(res as any);
  };

  useEffect(() => {
    // Load app data in order for functionality
    loadAppData();
  }, []);

  return (
    <SettingsWrapper>
      <div className="flex flex-row h-full w-full overflow-hidden rounded-xl">
        <Sidebar />
        <div className="flex flex-col w-full">
          <ChatWindow />
        </div>
      </div>
    </SettingsWrapper>
  );
};
