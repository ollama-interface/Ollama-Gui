export interface DatabaseConnection {
  id: string;
  name: string;
  type: "sqlite" | "postgres" | "mysql" | "mongodb";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  createdAt: Date;
  isActive: boolean;
}

class DatabaseConnectionManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private activeConnectionId: string | null = null;

  constructor() {
    this.loadConnections();
  }

  private loadConnections(): void {
    try {
      const stored = localStorage.getItem("db_connections");
      if (stored) {
        const connections = JSON.parse(stored) as DatabaseConnection[];
        connections.forEach((conn) => {
          this.connections.set(conn.id, {
            ...conn,
            createdAt: new Date(conn.createdAt),
          });
        });

        const activeId = localStorage.getItem("active_db_connection");
        if (activeId && this.connections.has(activeId)) {
          this.activeConnectionId = activeId;
        }
      }
    } catch (error) {
      console.error("[DB Manager] Failed to load connections:", error);
    }
  }

  private saveConnections(): void {
    try {
      const connections = Array.from(this.connections.values());
      localStorage.setItem("db_connections", JSON.stringify(connections));
      if (this.activeConnectionId) {
        localStorage.setItem("active_db_connection", this.activeConnectionId);
      }
    } catch (error) {
      console.error("[DB Manager] Failed to save connections:", error);
    }
  }

  addConnection(
    connection: Omit<DatabaseConnection, "id" | "createdAt">,
  ): DatabaseConnection {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConnection: DatabaseConnection = {
      ...connection,
      id,
      createdAt: new Date(),
    };

    this.connections.set(id, newConnection);
    this.saveConnections();

    console.log("[DB Manager] Connection added:", id);
    return newConnection;
  }

  updateConnection(
    id: string,
    updates: Partial<DatabaseConnection>,
  ): DatabaseConnection | null {
    const connection = this.connections.get(id);
    if (!connection) return null;

    const updated = {
      ...connection,
      ...updates,
      id,
      createdAt: connection.createdAt,
    };
    this.connections.set(id, updated);
    this.saveConnections();

    console.log("[DB Manager] Connection updated:", id);
    return updated;
  }

  deleteConnection(id: string): boolean {
    const deleted = this.connections.delete(id);
    if (deleted) {
      if (this.activeConnectionId === id) {
        this.activeConnectionId = null;
      }
      this.saveConnections();
      console.log("[DB Manager] Connection deleted:", id);
    }
    return deleted;
  }

  getConnection(id: string): DatabaseConnection | null {
    return this.connections.get(id) || null;
  }

  getAllConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }

  setActiveConnection(id: string): boolean {
    if (!this.connections.has(id)) return false;
    this.activeConnectionId = id;
    this.saveConnections();
    console.log("[DB Manager] Active connection set:", id);
    return true;
  }

  getActiveConnection(): DatabaseConnection | null {
    if (!this.activeConnectionId) return null;
    return this.connections.get(this.activeConnectionId) || null;
  }

  getActiveConnectionId(): string | null {
    return this.activeConnectionId;
  }

  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    console.log("[DB Manager] Testing connection:", connection.id);

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<boolean>("test_database_connection", {
        connectionType: connection.type,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database,
        connectionString: connection.connectionString,
      });

      console.log("[DB Manager] Connection test result:", result);
      return result;
    } catch (error) {
      console.error("[DB Manager] Connection test failed:", error);
      return false;
    }
  }
}

export const dbConnectionManager = new DatabaseConnectionManager();
