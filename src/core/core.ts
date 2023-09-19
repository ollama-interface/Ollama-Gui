import { SimpleCore } from "simple-core-state";

const instance = new SimpleCore(
	{ model: "llama2", localAPI: "http://127.0.0.1:11434" },
	{ storage: { prefix: "ollama_web_ui" } }
);

instance.persist(["model"]);

export const core = instance.core();
