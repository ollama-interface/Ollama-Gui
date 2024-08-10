import "../index.css";
import { Button } from "@/components/ui/button";
import { actions, core } from "@/core";
import { ChatHeader } from "@/parts/chat-header";
import { Sidebar } from "@/parts/sidebar";
import { Command } from "@tauri-apps/plugin-shell";
import Axios from "axios";
import { useCallback, useEffect } from "react";
import { useSimple } from "simple-core-state";

export const sendPrompt = async (prompt: string) => {
  try {
    await Axios({
      method: "POST",
      url: `${core.localAPI._value}/api/generate`,
      data: {
        model: "llama3",
        prompt: prompt,
        stream: true,
      },
    })
      .then((response) => {
        // Log each chunk of the stream
        response?.data?.on("data", (chunk) => {
          console.log("New chunk:", chunk?.toString());
        });

        // Handle the end of the stream
        response?.data?.on("end", () => {
          console.log("Stream ended");
        });
      })
      .catch((error) => {
        console.error("Error:", error.message);
      });
  } catch (error) {
    throw error;
  }
};

export const AppFrame = () => {
  async function startServer() {
    let result = await Command.create("ollama-server", [
      "-c",
      "OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11434 ollama serve",
    ]).execute();
    console.log(result);
  }

  const sendPromptMessage = async () => {
    // request the prompt
    const res = await sendPrompt("Hey, my name is twan. What are you?");
    console.log(res);
  };

  const database = useSimple(core.database);

  const checkDatabase = useCallback(() => {
    if (!database.ready) {
      // actions.prepareDatabase();
      core.database.patchObject({ ready: true });
    }
  }, [database]);

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <div className="flex flex-row h-full w-full">
      <Sidebar />
      <div className="flex flex-col w-full">
        <ChatHeader />
        <div className="h-full w-full bg-neutral-100 p-4">
          <Button onClick={startServer}>start server</Button>
          <Button onClick={sendPromptMessage}>Send message</Button>
        </div>
      </div>
    </div>
  );
};
