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
    server_host: "http://127.0.0.1:11435",
    server_connected: false,
    last_used_model: "",
    available_models: [],
    introduction_finished: false,
  },
  { storage: { prefix: "ollama_web_ui_" } }
);

instance.persist(["introduction_finished", "server_host", "last_used_model"]);

instance.events.create(["trigger_settings"]);

export const core = instance.core();
