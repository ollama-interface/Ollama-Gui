import { SimpleCore } from "simple-core-state";
import { ICoreType } from "./types";

const instance = new SimpleCore<ICoreType>(
  {
    database: {
      ready: false,
    },
    conversations: [],
    focused_conv_data: [],
    focused_conv_id: "",
    focused_conv_meta: {} as any,
    model: "llama2",
    localAPI: "http://127.0.0.1:11435",
    server_connected: false,
    installed_models: [],
    visited: false,
  },
  { storage: { prefix: "ollama_web_ui_" } }
);

instance.persist(["model", "visited"]);
instance.events.create(["trigger_settings"]);

export const core = instance.core();
