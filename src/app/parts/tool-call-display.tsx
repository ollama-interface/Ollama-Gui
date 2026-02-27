import { ToolCall, ToolResult } from "@/core/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ToolCallDisplayProps {
  toolCall: ToolCall;
  result?: ToolResult;
  onResultSubmit?: (result: string) => void;
  isLoading?: boolean;
}

export const ToolCallDisplay = ({
  toolCall,
  result,
  onResultSubmit,
  isLoading,
}: ToolCallDisplayProps) => {
  const [resultInput, setResultInput] = useState(result?.content || "");

  const handleSubmit = () => {
    if (resultInput.trim() && onResultSubmit) {
      onResultSubmit(resultInput);
      setResultInput("");
    }
  };

  return (
    <div className="border rounded-lg bg-blue-50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm text-blue-900">
            Tool Call: {toolCall.function.name}
          </p>
          <div className="mt-1 bg-white rounded p-2 text-xs font-mono text-gray-700">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(toolCall.function.arguments, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {result ? (
        <div className="flex items-start gap-2 bg-green-50 rounded p-2 border border-green-200">
          <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-900">Result:</p>
            <p className="text-xs text-green-800 mt-1">{result.content}</p>
          </div>
        </div>
      ) : onResultSubmit ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Waiting for tool result...
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tool result"
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              disabled={isLoading}
              className="text-xs h-8"
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !resultInput.trim()}
              size="sm"
              className="h-8 text-xs"
            >
              Submit
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface ToolCallsDisplayProps {
  toolCalls: ToolCall[];
  results?: ToolResult[];
  onResultsSubmit?: (results: ToolResult[]) => void;
  isLoading?: boolean;
}

export const ToolCallsDisplay = ({
  toolCalls,
  results = [],
  onResultsSubmit,
  isLoading,
}: ToolCallsDisplayProps) => {
  const [pendingResults, setPendingResults] = useState<ToolResult[]>(results);

  const handleResultSubmit = (toolIndex: number, result: string) => {
    const toolCall = toolCalls[toolIndex];
    const newResults = [...pendingResults];
    const existingIndex = newResults.findIndex(
      (r) => r.tool_name === toolCall.function.name,
    );

    if (existingIndex >= 0) {
      newResults[existingIndex].content = result;
    } else {
      newResults.push({
        tool_name: toolCall.function.name,
        content: result,
      });
    }

    setPendingResults(newResults);
  };

  const handleSubmitAll = () => {
    if (onResultsSubmit) {
      onResultsSubmit(pendingResults);
      setPendingResults([]);
    }
  };

  const allResultsProvided = toolCalls.every((call) =>
    pendingResults.some((r) => r.tool_name === call.function.name),
  );

  return (
    <div className="space-y-2">
      {toolCalls.map((toolCall, idx) => {
        const result = pendingResults.find(
          (r) => r.tool_name === toolCall.function.name,
        );
        return (
          <ToolCallDisplay
            key={idx}
            toolCall={toolCall}
            result={result}
            onResultSubmit={
              onResultsSubmit
                ? (res) => handleResultSubmit(idx, res)
                : undefined
            }
            isLoading={isLoading}
          />
        );
      })}

      {onResultsSubmit && !allResultsProvided && (
        <Button
          onClick={handleSubmitAll}
          disabled={isLoading || pendingResults.length === 0}
          className="w-full h-8 text-xs"
        >
          Continue with Results
        </Button>
      )}
    </div>
  );
};
