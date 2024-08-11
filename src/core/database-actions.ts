import { db } from "./local-database";

interface createConversationProps {
  id: string;
  title: string;
  created_at: Date;
  model: string;
}

export const createConversation = async (p: createConversationProps) => {
  console.log(Object.entries(p).map((item) => item[1]));

  try {
    await db.execute(
      "INSERT INTO conversations (id, title, created_at, model) VALUES ($1, $2, $3, $4)",
      [p.id, p.title, p.created_at, p.model]
    );
    return true;
  } catch (error) {
    console.log(error);
  }
};

export const getConversations = async () => {
  return await db.select("SELECT * FROM conversations");
};

export const getConversationMessages = async (id: string) => {
  return await db.select(
    "SELECT id, conversation_id, message, created_at, ai_replied, ctx FROM conversation_messages WHERE conversation_id = $1;",
    [id]
  );
};

interface SendPrompProps {
  id: string;
  conversation_id: string;
  message: string;
  created_at: Date;
  ai_replied: boolean;
  ctx: string;
}

export const sendPrompt = async (p: SendPrompProps) => {
  await db.execute(
    "INSERT INTO conversation_messages (id, conversation_id, message, created_at, ai_replied, ctx) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      p.id,
      p.conversation_id,
      p.message,
      p.created_at,
      p?.ai_replied ? 1 : 0,
      p?.ctx || null,
    ]
  );
  return true;
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
    [id]
  );
  return true;
};

export const prepareDatabase = async () => {
  // Create the conversations table
  await db.execute(
    `CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    mode TEXT NOT NULL,
    created_at DATETIME NOT NULL
  );`
  );

  // Create the conversation_messages table
  await db.execute(`
  CREATE TABLE conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    ai_replied INTEGER NOT NULL
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  )
`);

  return true;
};

export const flushDatbase = async () => {
  await db.execute(`DELETE FROM conversation_messages;`);
  await db.execute(`DELETE FROM conversations;`);
};
