import { SimpleCore } from "simple-core-state";
import { ICoreType } from "./types";

const instance = new SimpleCore<ICoreType>(
  {
    database: {
      ready: false,
    },
    conversations: {
      session: { chatHistory: [], ctx: [], model: "llama2", name: "Session" },
    },
    current_conversation: "session",
    model: "llama2",
    localAPI: "http://127.0.0.1:11434",
    server_connected: false,
    installed_models: [],
    visited: false,
  },
  { storage: { prefix: "ollama_web_ui_" } }
);

instance.persist([
  "database",
  "model",
  "localAPI",
  "visited",
  "conversations",
  "current_conversation",
]);

export const core = instance.core();
