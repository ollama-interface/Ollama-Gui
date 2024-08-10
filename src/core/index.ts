export * from "./utils";
export * from "./core";
export * from "./helper";
export * as actions from "./actions";
export const OLLAMA_HOST = `127.0.0.1:11435`;
export const OLLAMA_COMMAND = `OLLAMA_ORIGINS=* OLLAMA_HOST=${OLLAMA_HOST} ollama serve`;
