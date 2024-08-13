import { useCallback, useEffect } from "react";
import { actions, core, serverStatusCheck, syncModels } from "@/core";
import { loadDB } from "@/core/local-database";
import { Sidebar } from "@/app/parts/sidebar";
import { ChatWindow } from "./parts/chat-window";
import { SettingsWrapper } from "./parts/settings-wrapper";
import { Command } from "@tauri-apps/plugin-shell";
import { useSimple } from "simple-core-state";
import Axios from 'axios';

// Load the database on the app frame
loadDB();

let intervalID: NodeJS.Timeout;

export const AppFrame = () => {
  const host = useSimple(core.server_host);
   const startServer = useCallback(async () => {
    console.log(host);
    
     let result = await Command.create("ollama-server", [
       "-c",
       `OLLAMA_ORIGINS=* OLLAMA_HOST=${host} ollama serve`,
     ]).execute();
     console.log(result);
   }, [host]);

  

  const heartbeatCheck = async () => {
    intervalID = setInterval(async () => {
      serverStatusCheck();
    }, 5000)
  }

  const loadAppData = async () => {
    // Create the tables if not exists
    await actions.prepareDatabase();

    // Load available models
    syncModels();

    // Get all conversations from the db
    const res = await actions.getConversations();
    core.conversations.set(res as any);
  };

  useEffect(() => {
    startServer();
    serverStatusCheck();
    heartbeatCheck();
    setTimeout(() => {
      
      setTimeout(() => {
        // Load app data in order for functionality
        loadAppData();
      }, 50);
    }, 200);

    return () => {
      clearInterval(intervalID);
    }
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
