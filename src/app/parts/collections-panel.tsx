import { useState } from "react";
import { ChevronDown, Link2, Code2, Copy, ExternalLink } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { CollectionItem } from "./collections-utils";

interface CollectionsPanelProps {
  items: CollectionItem[];
  onClose?: () => void;
}

export const CollectionsPanel = ({ items, onClose }: CollectionsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const linkItems = items.filter((item) => item.type === "link");
  const codeItems = items.filter((item) => item.type === "code");

  const handleCopyCode = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await open(url);
    } catch (error) {
      console.error("Failed to open link:", error);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-neutral-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Collections</span>
          <span className="text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded-full">
            {items.length}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {linkItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1">
                  <Link2 size={14} />
                  Links ({linkItems.length})
                </h3>
                <div className="space-y-2">
                  {linkItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleOpenLink(item.content)}
                      className="w-full text-left px-3 py-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors group flex items-center justify-between"
                    >
                      <span className="text-sm text-blue-700 truncate flex-1">
                        {item.label || item.content}
                      </span>
                      <ExternalLink
                        size={14}
                        className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {codeItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1">
                  <Code2 size={14} />
                  Code Blocks ({codeItems.length})
                </h3>
                <div className="space-y-2">
                  {codeItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-50 rounded border border-neutral-200 overflow-hidden"
                    >
                      <div className="px-3 py-2 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
                        <span className="text-xs text-neutral-600 font-mono truncate flex-1">
                          {item.content.substring(0, 40)}
                          {item.content.length > 40 ? "..." : ""}
                        </span>
                        <button
                          onClick={() => handleCopyCode(item.content, item.id)}
                          className="ml-2 p-1 hover:bg-neutral-200 rounded transition-colors shrink-0"
                          title="Copy code"
                        >
                          <Copy
                            size={14}
                            className={
                              copiedId === item.id
                                ? "text-green-600"
                                : "text-neutral-600"
                            }
                          />
                        </button>
                      </div>
                      <pre className="text-xs p-2 bg-white overflow-x-auto whitespace-pre-wrap">
                        <code className="text-neutral-700">{item.content}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
