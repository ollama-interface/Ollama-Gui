// import { db } from "./local-database";

// interface createConversationProps {
//   id: string;
//   title: string;
//   created_at: Date;
//   model: string;
// }

// export const createConversation = (p: createConversationProps) => {
//   const stmt = db.prepare(
//     "INSERT INTO conversations (id, title, created_at, model) VALUES (@id, @title, @created_at, @model)"
//   );
//   stmt.run({ ...p });
//   return true;
// };

// export const getConversations = () => {
//   const stmt = db.prepare("SELECT id, title FROM conversations");

//   return stmt.get();
// };

// interface SendPrompProps {
//   id: string;
//   conversation_id: string;
//   message: string;
//   created_at: string;
// }

// export const sendPrompt = (p: SendPrompProps) => {
//   const stmt = db.prepare(
//     "INSERT INTO conversation_messages (id, conversation_id, message, created_at) VALUES (@id, @conversation_id, @message, @created_at)"
//   );
//   stmt.run({ ...p });
//   return true;
// };

// export const deleteConversation = () => {
//   const stmt = db.prepare("DELETE FROM conversations WHERE id = $id;");
//   const stmt2 = db.prepare(
//     "DELETE FROM conversation_messages WHERE conversation_id = $id;"
//   );
//   stmt.run();
//   stmt2.run();
//   return true;
// };

// export const prepareDatabase = () => {
//   // Create the conversations table
//   db.exec(`
//   CREATE TABLE IF NOT EXISTS conversations (
//     id TEXT PRIMARY KEY,
//     title TEXT NOT NULL,
//     mode TEXT NOT NULL,
//     created_at TEXT NOT NULL
//   )
// `);

//   // Create the conversation_messages table
//   db.exec(`
//   CREATE TABLE IF NOT EXISTS conversation_messages (
//     id TEXT PRIMARY KEY,
//     conversation_id TEXT NOT NULL,
//     message TEXT NOT NULL,
//     created_at TEXT NOT NULL,
//     FOREIGN KEY(conversation_id) REFERENCES conversations(id)
//   )
// `);

//   return true;
// };
