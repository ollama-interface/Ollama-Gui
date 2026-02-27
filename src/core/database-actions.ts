import { db } from "./local-database";

interface createConversationProps {
  id: string;
  title: string;
  created_at: Date;
  model: string;
}

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
  return await db.select(
    "SELECT id, conversation_id, message, created_at, ai_replied, ctx FROM conversation_messages WHERE conversation_id = $1;",
    [id],
  );
};

interface SendPrompProps {
  id: string;
  conversation_id: string;
  message: string;
  created_at: Date;
  ai_replied: boolean;
  ctx: string;
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
    await db.execute(
      "INSERT INTO conversation_messages (id, conversation_id, message, created_at, ai_replied, ctx, metrics) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        p.id,
        p.conversation_id,
        p.message,
        createdAt,
        p?.ai_replied ? 1 : 0,
        p?.ctx || null,
        metricsJson,
      ],
    );
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
  await db.execute("DELETE FROM conversations WHERE id = $1;", [id]);
  await db.execute(
    "DELETE FROM conversation_messages WHERE conversation_id = $1;",
    [id],
  );
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
