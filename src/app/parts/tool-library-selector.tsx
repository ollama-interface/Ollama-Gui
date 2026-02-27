import { useState } from "react";
import { Tool } from "@/core/types";
import { Button } from "@/components/ui/button";
import {
  TOOL_LIBRARY,
  TOOL_CATEGORIES,
  getToolsByCategory,
} from "@/core/tools";
import { Check, Plus, Trash2, ChevronDown } from "lucide-react";

interface ToolLibrarySelectorProps {
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export const ToolLibrarySelector = ({
  selectedTools,
  onToolsChange,
}: ToolLibrarySelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const selectedToolNames = new Set(selectedTools.map((t) => t.function.name));

  const toggleTool = (tool: Tool) => {
    if (selectedToolNames.has(tool.function.name)) {
      onToolsChange(
        selectedTools.filter((t) => t.function.name !== tool.function.name),
      );
    } else {
      onToolsChange([...selectedTools, tool]);
    }
  };

  const clearAllTools = () => {
    onToolsChange([]);
  };

  const selectAllInCategory = (category: string) => {
    const categoryTools = getToolsByCategory(category);
    const newTools = [...selectedTools];

    categoryTools.forEach((tool) => {
      if (!selectedToolNames.has(tool.function.name)) {
        newTools.push(tool);
      }
    });

    onToolsChange(newTools);
  };

  const deselectAllInCategory = (category: string) => {
    const categoryTools = getToolsByCategory(category);
    const categoryToolNames = new Set(
      categoryTools.map((t) => t.function.name),
    );

    onToolsChange(
      selectedTools.filter((t) => !categoryToolNames.has(t.function.name)),
    );
  };

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Tool Library</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {selectedTools.length} selected
          </span>
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
          {selectedTools.length > 0 && (
            <div className="bg-blue-50 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-blue-900">
                  Selected Tools
                </p>
                <button
                  onClick={clearAllTools}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTools.map((tool) => (
                  <div
                    key={tool.function.name}
                    className="bg-white border border-blue-200 rounded px-2 py-1 text-xs flex items-center gap-1"
                  >
                    <span>{tool.function.name}</span>
                    <button
                      onClick={() => toggleTool(tool)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">
              Browse by Category
            </p>
            {Object.keys(TOOL_CATEGORIES).map((category) => {
              const categoryTools = getToolsByCategory(category);
              const selectedInCategory = categoryTools.filter((t) =>
                selectedToolNames.has(t.function.name),
              );
              const isExpanded = expandedCategory === category;

              return (
                <div key={category} className="border rounded">
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category)
                    }
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {selectedInCategory.length}/{categoryTools.length}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-3 space-y-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => selectAllInCategory(category)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => deselectAllInCategory(category)}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Deselect All
                        </button>
                      </div>

                      <div className="space-y-1">
                        {categoryTools.map((tool) => {
                          const isSelected = selectedToolNames.has(
                            tool.function.name,
                          );
                          return (
                            <button
                              key={tool.function.name}
                              onClick={() => toggleTool(tool)}
                              className={`w-full text-left px-2 py-2 rounded text-xs transition-colors ${
                                isSelected
                                  ? "bg-blue-100 border border-blue-300"
                                  : "bg-white border border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={12} className="text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {tool.function.name}
                                  </p>
                                  <p className="text-gray-600">
                                    {tool.function.description}
                                  </p>
                                  <p className="text-gray-500 mt-1">
                                    Parameters:{" "}
                                    {Object.keys(
                                      tool.function.parameters.properties,
                                    ).join(", ") || "none"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
