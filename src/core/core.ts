import { SimpleCore } from "simple-core-state";

const instance = new SimpleCore(
	{ model: "llama2" },
	{ storage: { prefix: "ollama_web_ui" } }
);

instance.persist(["model"]);

export const core = instance.core();
