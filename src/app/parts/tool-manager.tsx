import { useState } from "react";
import { Tool, ToolFunction, ToolParameter } from "@/core/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

interface ToolManagerProps {
  tools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export const ToolManager = ({ tools, onToolsChange }: ToolManagerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDesc, setNewToolDesc] = useState("");

  const addTool = () => {
    if (!newToolName.trim()) return;

    const newTool: Tool = {
      type: "function",
      function: {
        name: newToolName,
        description: newToolDesc || "No description",
        parameters: {
          type: "object",
          required: [],
          properties: {},
        },
      },
    };

    onToolsChange([...tools, newTool]);
    setNewToolName("");
    setNewToolDesc("");
  };

  const removeTool = (index: number) => {
    onToolsChange(tools.filter((_, i) => i !== index));
  };

  const updateToolParameter = (
    toolIndex: number,
    paramName: string,
    paramType: string,
    paramDesc: string,
  ) => {
    const updatedTools = [...tools];
    const tool = updatedTools[toolIndex];

    if (tool.function.parameters.properties[paramName]) {
      tool.function.parameters.properties[paramName] = {
        type: paramType as any,
        description: paramDesc,
      };
    } else {
      tool.function.parameters.properties[paramName] = {
        type: paramType as any,
        description: paramDesc,
      };
      if (!tool.function.parameters.required.includes(paramName)) {
        tool.function.parameters.required.push(paramName);
      }
    }

    onToolsChange(updatedTools);
  };

  const removeParameter = (toolIndex: number, paramName: string) => {
    const updatedTools = [...tools];
    const tool = updatedTools[toolIndex];

    delete tool.function.parameters.properties[paramName];
    tool.function.parameters.required = tool.function.parameters.required.filter(
      (p) => p !== paramName,
    );

    onToolsChange(updatedTools);
  };

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-medium text-sm">Tools ({tools.length})</span>
        <span className="text-xs text-gray-500">
          {isExpanded ? "▼" : "▶"}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {tools.length === 0 ? (
            <p className="text-xs text-gray-500">No tools defined yet</p>
          ) : (
            <div className="space-y-3">
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3 bg-gray-50 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tool.function.name}</p>
                      <p className="text-xs text-gray-600">
                        {tool.function.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeTool(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-medium text-gray-700">Parameters:</p>
                    {Object.entries(
                      tool.function.parameters.properties,
                    ).length === 0 ? (
                      <p className="text-gray-500">No parameters</p>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(
                          tool.function.parameters.properties,
                        ).map(([paramName, param]) => (
                          <div
                            key={paramName}
                            className="flex items-center justify-between bg-white p-1 rounded"
                          >
                            <span>
                              {paramName}: {(param as ToolParameter).type}
                            </span>
                            <button
                              onClick={() =>
                                removeParameter(idx, paramName)
                              }
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-medium">Add New Tool</p>
            <Input
              placeholder="Tool name"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              className="text-xs h-8"
            />
            <Input
              placeholder="Description"
              value={newToolDesc}
              onChange={(e) => setNewToolDesc(e.target.value)}
              className="text-xs h-8"
            />
            <Button
              onClick={addTool}
              size="sm"
              className="w-full h-8 text-xs"
            >
              <Plus size={14} className="mr-1" /> Add Tool
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
