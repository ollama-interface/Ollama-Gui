import Database from "@tauri-apps/plugin-sql";
import { core } from "./core";
import { prepareDatabase } from "./database-actions";

export let db: Database;

export const loadDB = async () => {
  try {
    db = await Database.load("sqlite:ollama-chat.db");
    await prepareDatabase();
    core.database.patchObject({ ready: true });
  } catch (error) {
    console.error("Something went wrong with loading the database", error);
  }
};
