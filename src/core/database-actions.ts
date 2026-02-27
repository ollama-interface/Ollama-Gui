import { db } from "./local-database";
import { appDataDir } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";

interface createConversationProps {
  id: string;
  title: string;
  created_at: Date;
  model: string;
}

export const getDatabasePath = async (): Promise<string> => {
  try {
    // The database is stored in Tauri's app data directory
    // For production: ~/.local/share/com.tauri.ollama-interface/ (Linux)
    //                ~/Library/Application Support/com.tauri.ollama-interface/ (macOS)
    //                %APPDATA%\com.tauri.ollama-interface\ (Windows)
    const dataDir = await appDataDir();
    const dbPath = `${dataDir}ollama-chat.db`;
    return dbPath;
  } catch (error) {
    console.error("Error getting database path:", error);
    return "ollama-chat.db";
  }
};

export const openDatabaseFile = async () => {
  try {
    const dataDir = await appDataDir();
    const dbPath = `${dataDir}ollama-chat.db`;

    // Get the parent directory where the database file is located
    const parentDir = dbPath.substring(0, dbPath.lastIndexOf("/"));

    try {
      // Use the opener plugin to open the folder
      await openPath(parentDir);
    } catch (error) {
      console.warn("Failed to open file explorer:", error);
      alert(`Could not open file explorer.\n\nDatabase location:\n${dbPath}`);
    }
  } catch (error) {
    console.error("Error opening database file:", error);
    alert(
      "Could not open database file. Please check the path in the settings.",
    );
  }
};

export const createConversation = async (p: createConversationProps) => {
  try {
    await db.execute(
      "INSERT INTO conversations (id, title, created_at, model) VALUES ($1, $2, $3, $4)",
      [p.id, p.title, p.created_at, p.model],
    );
    return true;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const getConversations = async () => {
  return await db.select("SELECT * FROM conversations");
};

export const getConversationMessages = async (id: string) => {
  const messages = await db.select(
    "SELECT id, conversation_id, message, created_at, ai_replied, ctx, tool_calls, tool_results, metrics FROM conversation_messages WHERE conversation_id = $1;",
    [id],
  );

  return (messages as any[]).map((msg) => ({
    ...msg,
    ai_replied: msg.ai_replied === 1 || msg.ai_replied === true,
    tool_calls: msg.tool_calls ? JSON.parse(msg.tool_calls) : undefined,
    tool_results: msg.tool_results ? JSON.parse(msg.tool_results) : undefined,
    metrics: msg.metrics ? JSON.parse(msg.metrics) : undefined,
  }));
};

interface SendPrompProps {
  id: string;
  conversation_id: string;
  message: string;
  created_at: Date;
  ai_replied: boolean;
  ctx: string;
  tool_calls?: string;
  tool_results?: string;
  metrics?: {
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  };
}

export const sendPrompt = async (p: SendPrompProps) => {
  try {
    const createdAt =
      p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at;
    const metricsJson = p.metrics ? JSON.stringify(p.metrics) : null;

    // Check if message already exists
    const existing = await db.select(
      "SELECT id FROM conversation_messages WHERE id = $1",
      [p.id],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // Update existing message
      await db.execute(
        "UPDATE conversation_messages SET message = $1, ai_replied = $2, ctx = $3, tool_calls = $4, tool_results = $5, metrics = $6 WHERE id = $7",
        [
          p.message,
          p?.ai_replied ? 1 : 0,
          p?.ctx || null,
          p?.tool_calls || null,
          p?.tool_results || null,
          metricsJson,
          p.id,
        ],
      );
    } else {
      // Insert new message
      await db.execute(
        "INSERT INTO conversation_messages (id, conversation_id, message, created_at, ai_replied, ctx, tool_calls, tool_results, metrics) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          p.id,
          p.conversation_id,
          p.message,
          createdAt,
          p?.ai_replied ? 1 : 0,
          p?.ctx || null,
          p?.tool_calls || null,
          p?.tool_results || null,
          metricsJson,
        ],
      );
    }
    return true;
  } catch (error) {
    console.error("Error saving prompt:", error);
    throw error;
  }
};

export const updateConversationName = async (name: string, conv_id: string) => {
  await db.execute("UPDATE conversations SET title = $1 WHERE id = $2", [
    name,
    conv_id,
  ]);
};

export const deleteConversation = async (id: string) => {
  await db.execute(
    "DELETE FROM conversation_messages WHERE conversation_id = $1;",
    [id],
  );
  await db.execute("DELETE FROM conversations WHERE id = $1;", [id]);
  return true;
};

export const prepareDatabase = async () => {
  try {
    // Create the conversations table
    await db.execute(
      `CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      model TEXT NOT NULL,
      created_at DATETIME NOT NULL
    );`,
    );

    // Create the conversation_messages table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      ai_replied INTEGER NOT NULL,
      ctx TEXT,
      metrics TEXT,
      tool_calls TEXT,
      tool_results TEXT,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
  `);

    // Add metrics column if it doesn't exist (migration for existing databases)
    try {
      await db.execute(
        `ALTER TABLE conversation_messages ADD COLUMN metrics TEXT;`,
      );
    } catch (error) {
      // Column already exists, ignore error
    }

    // Add tool_calls column if it doesn't exist (migration for existing databases)
    try {
      await db.execute(
        `ALTER TABLE conversation_messages ADD COLUMN tool_calls TEXT;`,
      );
    } catch (error) {
      // Column already exists, ignore error
    }

    // Add tool_results column if it doesn't exist (migration for existing databases)
    try {
      await db.execute(
        `ALTER TABLE conversation_messages ADD COLUMN tool_results TEXT;`,
      );
    } catch (error) {
      // Column already exists, ignore error
    }

    return true;
  } catch (error) {
    console.error("Error preparing database:", error);
    throw error;
  }
};

export const flushDatbase = async () => {
  await db.execute(`DELETE FROM conversation_messages;`);
  await db.execute(`DELETE FROM conversations;`);
};

export interface DatabaseStats {
  conversationCount: number;
  messageCount: number;
  totalSize: string;
}

export const getDatabaseStats = async (): Promise<DatabaseStats> => {
  try {
    const conversations = (await db.select(
      "SELECT COUNT(*) as count FROM conversations",
    )) as Array<{ count: number }>;
    const messages = (await db.select(
      "SELECT COUNT(*) as count FROM conversation_messages",
    )) as Array<{ count: number }>;

    const conversationCount = conversations[0]?.count || 0;
    const messageCount = messages[0]?.count || 0;

    return {
      conversationCount,
      messageCount,
      totalSize: `${conversationCount + messageCount} items`,
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    return {
      conversationCount: 0,
      messageCount: 0,
      totalSize: "0 items",
    };
  }
};
