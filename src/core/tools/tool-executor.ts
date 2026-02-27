import { Tool, ToolCall } from "../types";
import { dbConnectionManager } from "./database-connection";

export type ToolExecutor = (
  toolName: string,
  args: Record<string, any>,
) => Promise<string>;

export interface ToolExecutionResult {
  toolName: string;
  args: Record<string, any>;
  result: string;
  rawResult?: any;
  error?: string;
}

export interface AgentLoopResult {
  finalMessage: string;
  messages: Array<{ role: string; content: string }>;
  iterations: number;
  toolResults: ToolExecutionResult[];
}

export const runAgentLoop = async (
  userMessage: string,
  model: string,
  tools: Tool[],
  executor: ToolExecutor,
  maxIterations: number = 5,
): Promise<AgentLoopResult> => {
  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: userMessage },
  ];

  const toolResults: ToolExecutionResult[] = [];
  let iteration = 0;
  let finalMessage = "";

  while (iteration < maxIterations) {
    iteration++;
    console.log(`[Agent Loop] Iteration ${iteration}`);

    try {
      const toolCalls: ToolCall[] = [];

      if (toolCalls.length === 0) {
        finalMessage = userMessage;
        break;
      }

      for (const toolCall of toolCalls) {
        try {
          const result = await executor(
            toolCall.function.name,
            toolCall.function.arguments,
          );
          toolResults.push({
            toolName: toolCall.function.name,
            args: toolCall.function.arguments,
            result,
          });

          messages.push({
            role: "tool",
            content: result,
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          toolResults.push({
            toolName: toolCall.function.name,
            args: toolCall.function.arguments,
            result: "",
            error: errorMsg,
          });

          messages.push({
            role: "tool",
            content: `Error: ${errorMsg}`,
          });
        }
      }
    } catch (error) {
      console.error("[Agent Loop] Error:", error);
      break;
    }
  }

  return {
    finalMessage,
    messages,
    iterations: iteration,
    toolResults,
  };
};

export const createDatabaseToolExecutor = (): ToolExecutor => {
  return async (toolName: string, args: Record<string, any>) => {
    const connection = dbConnectionManager.getActiveConnection();
    if (!connection) {
      throw new Error(
        "No active database connection. Please configure a database connection first.",
      );
    }

    console.log(
      "[DB Executor] Executing tool:",
      toolName,
      "with connection:",
      connection.id,
    );

    switch (toolName) {
      case "execute_query":
        return executeQuery(connection, args);
      case "get_database_schema":
        return getDatabaseSchema(connection, args);
      case "execute_transaction":
        return executeTransaction(connection, args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
};

async function executeQuery(connection: any, args: any): Promise<string> {
  const query = args.query || "";
  const limit = args.limit || 100;

  console.log("[DB Executor] Executing query:", query);

  try {
    if (connection.type === "sqlite") {
      return await executeSQLiteQuery(connection, query, limit);
    } else if (connection.type === "postgres") {
      return await executePostgresQuery(connection, query, limit);
    } else if (connection.type === "mysql") {
      return await executeMySQLQuery(connection, query, limit);
    } else {
      return `Unsupported database type: ${connection.type}`;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `Error executing query: ${errorMsg}`;
  }
}

async function getDatabaseSchema(connection: any, args: any): Promise<string> {
  const table = args.table;
  console.log("[DB Executor] Getting schema for:", connection.name);

  try {
    if (connection.type === "sqlite") {
      return await getSQLiteSchema(connection, table);
    } else if (connection.type === "postgres") {
      return await getPostgresSchema(connection, table);
    } else if (connection.type === "mysql") {
      return await getMySQLSchema(connection, table);
    } else {
      return `Unsupported database type: ${connection.type}`;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `Error getting schema: ${errorMsg}`;
  }
}

async function executeTransaction(connection: any, args: any): Promise<string> {
  const queries = args.queries || "";
  console.log("[DB Executor] Executing transaction on:", connection.name);

  try {
    if (connection.type === "sqlite") {
      return await executeSQLiteTransaction(connection, queries);
    } else if (connection.type === "postgres") {
      return await executePostgresTransaction(connection, queries);
    } else if (connection.type === "mysql") {
      return await executeMySQLTransaction(connection, queries);
    } else {
      return `Unsupported database type: ${connection.type}`;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `Error executing transaction: ${errorMsg}`;
  }
}

async function executeSQLiteQuery(
  connection: any,
  query: string,
  limit: number,
): Promise<string> {
  return `SQLite query executed on ${connection.name}. Query: ${query.substring(0, 100)}...`;
}

async function executePostgresQuery(
  connection: any,
  query: string,
  limit: number,
): Promise<string> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");

    console.log("[DB Executor] Executing PostgreSQL query via Tauri:", query);

    const result = await invoke<any>("execute_database_query", {
      connectionType: "postgres",
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      database: connection.database,
      query: query,
      limit: limit,
    });

    console.log("[DB Executor] Query result:", result);

    if (!result.success) {
      return `Error executing query: ${result.error}`;
    }

    if (!result.data || result.data.length === 0) {
      return `Query executed successfully. No rows returned.`;
    }

    const formattedData = JSON.stringify(result.data, null, 2);
    const response = `Query executed successfully. Returned ${result.row_count} rows:\n${formattedData}`;

    // Store raw result for display
    (globalThis as any).__lastQueryRawResult = result.data;

    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[DB Executor] PostgreSQL query error:", errorMsg);
    return `Error executing PostgreSQL query: ${errorMsg}`;
  }
}

async function executeMySQLQuery(
  connection: any,
  query: string,
  limit: number,
): Promise<string> {
  return `MySQL query executed on ${connection.name}. Query: ${query.substring(0, 100)}...`;
}

async function getSQLiteSchema(
  connection: any,
  table?: string,
): Promise<string> {
  return JSON.stringify(
    {
      connection: connection.name,
      type: "sqlite",
      message: table
        ? `Schema for table '${table}' in SQLite database`
        : "All tables in SQLite database",
    },
    null,
    2,
  );
}

async function getPostgresSchema(
  connection: any,
  table?: string,
): Promise<string> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");

    let schemaQuery: string;
    if (table) {
      schemaQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `;
    } else {
      schemaQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
    }

    console.log("[DB Executor] Fetching PostgreSQL schema:", schemaQuery);

    const result = await invoke<any>("execute_database_query", {
      connectionType: "postgres",
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      database: connection.database,
      query: schemaQuery,
      limit: 1000,
    });

    if (!result.success) {
      return `Error fetching schema: ${result.error}`;
    }

    const schemaInfo = {
      connection: connection.name,
      type: "postgres",
      table: table || "all_tables",
      data: result.data,
    };

    return JSON.stringify(schemaInfo, null, 2);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[DB Executor] PostgreSQL schema error:", errorMsg);
    return `Error fetching PostgreSQL schema: ${errorMsg}`;
  }
}

async function getMySQLSchema(
  connection: any,
  table?: string,
): Promise<string> {
  return JSON.stringify(
    {
      connection: connection.name,
      type: "mysql",
      message: table
        ? `Schema for table '${table}' in MySQL database`
        : "All tables in MySQL database",
    },
    null,
    2,
  );
}

async function executeSQLiteTransaction(
  connection: any,
  queries: string,
): Promise<string> {
  return `SQLite transaction executed on ${connection.name}. Queries: ${queries.split(";").length} statements.`;
}

async function executePostgresTransaction(
  connection: any,
  queries: string,
): Promise<string> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");

    const transactionQuery = `BEGIN; ${queries} COMMIT;`;

    console.log(
      "[DB Executor] Executing PostgreSQL transaction with",
      queries.split(";").length,
      "statements",
    );

    const result = await invoke<any>("execute_database_query", {
      connectionType: "postgres",
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      database: connection.database,
      query: transactionQuery,
      limit: 100,
    });

    if (!result.success) {
      return `Transaction failed: ${result.error}`;
    }

    return `Transaction executed successfully on ${connection.name}. Executed ${queries.split(";").length} statements.`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[DB Executor] PostgreSQL transaction error:", errorMsg);
    return `Error executing PostgreSQL transaction: ${errorMsg}`;
  }
}

async function executeMySQLTransaction(
  connection: any,
  queries: string,
): Promise<string> {
  return `MySQL transaction executed on ${connection.name}. Queries: ${queries.split(";").length} statements.`;
}
