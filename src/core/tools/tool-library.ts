import { Tool } from "../types";

export const TOOL_LIBRARY: Record<string, Tool> = {
  execute_query: {
    type: "function",
    function: {
      name: "execute_query",
      description:
        "ALWAYS use this tool when the user asks to view, fetch, retrieve, show, or query data from the database. Execute a SQL query and return the actual results. Do not make up data.",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description:
              "The SQL query to execute (SELECT, INSERT, UPDATE, DELETE, etc.). Write valid SQL for the connected database.",
          },
          database: {
            type: "string",
            description:
              "The database name or connection identifier (optional, uses default if not specified)",
          },
          limit: {
            type: "integer",
            description: "Maximum number of rows to return (default: 100)",
          },
        },
      },
    },
  },

  get_database_schema: {
    type: "function",
    function: {
      name: "get_database_schema",
      description:
        "ALWAYS use this tool when the user asks about table structure, columns, schema, or database structure. Get the schema information for a database (tables, columns, types, constraints).",
      parameters: {
        type: "object",
        required: [],
        properties: {
          database: {
            type: "string",
            description:
              "The database name (optional, uses default if not specified)",
          },
          table: {
            type: "string",
            description:
              "Specific table name to get schema for (optional, returns all tables if not specified)",
          },
        },
      },
    },
  },

  execute_transaction: {
    type: "function",
    function: {
      name: "execute_transaction",
      description:
        "ALWAYS use this tool when the user asks to perform multiple database operations that should be executed together. Execute multiple SQL queries as a single transaction to ensure data consistency.",
      parameters: {
        type: "object",
        required: ["queries"],
        properties: {
          queries: {
            type: "string",
            description:
              "Multiple SQL queries separated by semicolons. Each query will be executed in order within a transaction.",
          },
          database: {
            type: "string",
            description:
              "The database name or connection identifier (optional)",
          },
        },
      },
    },
  },
};

export const TOOL_CATEGORIES: Record<string, string[]> = {
  Database: ["execute_query", "get_database_schema", "execute_transaction"],
};

export const getToolsByCategory = (category: string): Tool[] => {
  const toolIds = TOOL_CATEGORIES[category] || [];
  return toolIds.map((id) => TOOL_LIBRARY[id]).filter(Boolean);
};

export const getAllTools = (): Tool[] => {
  return Object.values(TOOL_LIBRARY);
};

export const getToolById = (id: string): Tool | undefined => {
  return TOOL_LIBRARY[id];
};

export const getToolCategories = (): string[] => {
  return Object.keys(TOOL_CATEGORIES);
};
