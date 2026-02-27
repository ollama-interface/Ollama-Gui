import { useState } from "react";
import { X, Database, Wrench } from "lucide-react";
import { DatabaseConnectionManager } from "./database-connection-manager";
import { ToolLibrarySelector } from "./tool-library-selector";
import { Tool } from "@/core/types";

interface ToolCallingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export const ToolCallingManager = ({
  isOpen,
  onClose,
  selectedTools,
  onToolsChange,
}: ToolCallingManagerProps) => {
  const [activeTab, setActiveTab] = useState<"connections" | "tools">(
    "connections"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tool Calling Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("connections")}
            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === "connections"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Database size={18} />
            Database Connections
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === "tools"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Wrench size={18} />
            Tools
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "connections" && <DatabaseConnectionManager />}
          {activeTab === "tools" && (
            <ToolLibrarySelector
              selectedTools={selectedTools}
              onToolsChange={onToolsChange}
            />
          )}
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
