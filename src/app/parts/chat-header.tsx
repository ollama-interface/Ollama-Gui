import { core } from "@/core";
import dayjs from "dayjs";
import { useSimple } from "simple-core-state";
import { useMemo, useState } from "react";
import { CollectionsPanel } from "./collections-panel";
import { extractCollectionsFromMessages } from "./collections-utils";
import { Link2, Code2 } from "lucide-react";

export const ChatHeader = () => {
  const conversation_meta = useSimple(core.focused_conv_meta);
  const last_used_model = useSimple(core.last_used_model);
  const messages = useSimple(core.focused_conv_data);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  const collectionItems = useMemo(() => {
    return extractCollectionsFromMessages(messages || []);
  }, [messages]);

  return (
    <div className="relative h-[50px] border-b border-neutral-200 bg-neutral-50 w-full">
      <div
        className="h-[50px] drag-window flex justify-between items-center px-4"
        data-tauri-drag-region
      >
        <div>
          <p className="text-sm font-medium tracking-tight">
            {conversation_meta?.title || " "}
          </p>
          <p className="text-xs italic opacity-40">{last_used_model}</p>
        </div>
        <div className="flex items-center gap-3">
          {conversation_meta.created_at && (
            <div className="flex-row flex items-center">
              <p className="mr-1 opacity-40 text-sm italic">Created:</p>
              <p className="opacity-60 text-sm italic">
                {dayjs(conversation_meta.created_at).format(
                  "MMM DD YYYY, HH:mm:ss a",
                )}
              </p>
            </div>
          )}
          {collectionItems.length > 0 && (
            <button
              onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-200 transition-colors"
              title="View collections"
            >
              <div className="flex items-center gap-1">
                {collectionItems.some((item) => item.type === "link") && (
                  <Link2 size={14} className="text-blue-600" />
                )}
                {collectionItems.some((item) => item.type === "code") && (
                  <Code2 size={14} className="text-green-600" />
                )}
              </div>
              <span className="text-xs bg-neutral-300 text-neutral-700 px-1.5 py-0.5 rounded-full">
                {collectionItems.length}
              </span>
            </button>
          )}
        </div>
      </div>
      {collectionItems.length > 0 && isCollectionsOpen && (
        <div className="absolute top-[50px] left-0 right-0 bg-white border-b border-neutral-200 shadow-lg z-40">
          <CollectionsPanel
            items={collectionItems}
            onClose={() => setIsCollectionsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
