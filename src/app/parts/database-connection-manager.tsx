import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Check, X, ChevronDown, Zap } from "lucide-react";
import { dbConnectionManager, DatabaseConnection } from "@/core/tools";

export const DatabaseConnectionManager = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(
    null,
  );
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "sqlite" as "sqlite" | "postgres" | "mysql" | "mongodb",
    host: "",
    port: 5432,
    username: "",
    password: "",
    database: "",
    connectionString: "",
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    const allConnections = dbConnectionManager.getAllConnections();
    setConnections(allConnections);
    const active = dbConnectionManager.getActiveConnectionId();
    setActiveConnectionId(active);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "sqlite",
      host: "",
      port: 5432,
      username: "",
      password: "",
      database: "",
      connectionString: "",
    });
    setEditingId(null);
  };

  const handleAddConnection = () => {
    if (!formData.name.trim()) {
      alert("Please enter a connection name");
      return;
    }

    if (editingId) {
      dbConnectionManager.updateConnection(editingId, formData);
    } else {
      dbConnectionManager.addConnection({
        ...formData,
        isActive: false,
      });
    }

    loadConnections();
    resetForm();
    setShowForm(false);
  };

  const handleDeleteConnection = (id: string) => {
    if (confirm("Are you sure you want to delete this connection?")) {
      dbConnectionManager.deleteConnection(id);
      loadConnections();
    }
  };

  const handleSetActive = (id: string) => {
    dbConnectionManager.setActiveConnection(id);
    setActiveConnectionId(id);
    loadConnections();
  };

  const handleEditConnection = (connection: DatabaseConnection) => {
    setFormData({
      name: connection.name,
      type: connection.type,
      host: connection.host || "",
      port: connection.port || 5432,
      username: connection.username || "",
      password: connection.password || "",
      database: connection.database || "",
      connectionString: connection.connectionString || "",
    });
    setEditingId(connection.id);
    setShowForm(true);
  };

  const handleTestConnection = async (connection: DatabaseConnection) => {
    setTestingConnectionId(connection.id);
    try {
      const result = await dbConnectionManager.testConnection(connection);
      setTestResult({
        id: connection.id,
        success: result,
        message: result
          ? `✓ Successfully connected to ${connection.name}`
          : `✗ Failed to connect to ${connection.name}`,
      });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setTestResult({
        id: connection.id,
        success: false,
        message: `✗ Connection error: ${errorMsg}`,
      });
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setTestingConnectionId(null);
    }
  };

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Database Connections</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {connections.length}
          </span>
          {activeConnectionId && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Active
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {connections.length === 0 && !showForm && (
            <p className="text-xs text-gray-500 italic">
              No connections configured
            </p>
          )}

          {connections.length > 0 && (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className={`border rounded p-3 ${
                    activeConnectionId === conn.id
                      ? "bg-green-50 border-green-300"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{conn.name}</p>
                      <p className="text-xs text-gray-600">
                        {conn.type}
                        {conn.host && ` • ${conn.host}`}
                        {conn.database && ` • ${conn.database}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleTestConnection(conn)}
                        disabled={testingConnectionId === conn.id}
                        className="text-yellow-600 hover:text-yellow-700 p-1 disabled:opacity-50"
                        title="Test connection"
                      >
                        <Zap size={16} />
                      </button>
                      {activeConnectionId !== conn.id && (
                        <button
                          onClick={() => handleSetActive(conn.id)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Set as active"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditConnection(conn)}
                        className="text-gray-600 hover:text-gray-700 p-1"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(conn.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {testResult && testResult.id === conn.id && (
                    <div
                      className={`text-xs p-2 rounded mt-2 ${
                        testResult.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {testResult.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="border rounded p-3 bg-blue-50 space-y-2">
              <p className="text-xs font-medium text-blue-900">
                {editingId ? "Edit Connection" : "Add New Connection"}
              </p>

              <Input
                placeholder="Connection name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-xs h-7"
              />

              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as
                      | "sqlite"
                      | "postgres"
                      | "mysql"
                      | "mongodb",
                  })
                }
                className="w-full text-xs h-7 px-2 border rounded"
              >
                <option value="sqlite">SQLite</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongodb">MongoDB</option>
              </select>

              {formData.type !== "sqlite" && (
                <>
                  <Input
                    placeholder="Host"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    className="text-xs h-7"
                  />
                  <Input
                    placeholder="Port"
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: parseInt(e.target.value),
                      })
                    }
                    className="text-xs h-7"
                  />
                  <Input
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="text-xs h-7"
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="text-xs h-7"
                  />
                  <Input
                    placeholder="Database"
                    value={formData.database}
                    onChange={(e) =>
                      setFormData({ ...formData, database: e.target.value })
                    }
                    className="text-xs h-7"
                  />
                </>
              )}

              {formData.type === "sqlite" && (
                <Input
                  placeholder="File path or connection string"
                  value={formData.connectionString}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      connectionString: e.target.value,
                    })
                  }
                  className="text-xs h-7"
                />
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleAddConnection}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                >
                  {editingId ? "Update" : "Add"}
                </Button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
              className="w-full h-7 text-xs"
            >
              <Plus size={12} className="mr-1" /> Add Connection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
