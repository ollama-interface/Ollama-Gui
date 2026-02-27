import Database from "@tauri-apps/plugin-sql";
import { core } from "./core";

export let db: Database;

export const loadDB = async () => {
  try {
    db = await Database.load("sqlite:ollama-chat.db");
    core.database.patchObject({ ready: true });
  } catch (error) {
    console.log("Something went wrong with loading the database", error);
  }
};
