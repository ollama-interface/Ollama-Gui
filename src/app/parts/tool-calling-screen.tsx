import React, { useState } from "react";
import { ChevronLeft, Database, Wrench } from "lucide-react";
import { DatabaseConnectionManager } from "./database-connection-manager";
import { ToolLibrarySelector } from "./tool-library-selector";
import { Tool } from "@/core/types";

interface ToolCallingScreenProps {
  onBack: () => void;
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export const ToolCallingScreen = ({
  onBack,
  selectedTools,
  onToolsChange,
}: ToolCallingScreenProps) => {
  const [activeTab, setActiveTab] = useState<"connections" | "tools">(
    "connections"
  );

  return (
    <div className="h-full flex flex-col bg-neutral-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to chat"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Tool Calling Manager</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white flex">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {activeTab === "connections" && <DatabaseConnectionManager />}
          {activeTab === "tools" && (
            <ToolLibrarySelector
              selectedTools={selectedTools}
              onToolsChange={onToolsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
