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
    server_host: "http://127.0.0.1:11434",
    server_connected: false,
    last_used_model: "",
    available_models: [],
    introduction_finished: false,
    streaming_conv_id: "",
    show_metrics: true,
  },
  {
    storage: { prefix: "ollama_web_ui_" },
    persist: [
      "introduction_finished",
      "server_host",
      "last_used_model",
      "show_metrics",
    ],
  },
);

instance.events.create(["trigger_settings"]);

export const core = instance.core();
