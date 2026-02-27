import { core } from "@/core";
import dayjs from "dayjs";
import { useSimple } from "simple-core-state";
import { useMemo, useState } from "react";
import { CollectionsPanel } from "./collections-panel";
import { extractCollectionsFromMessages } from "./collections-utils";

export const ChatHeader = () => {
  const conversation_meta = useSimple(core.focused_conv_meta);
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
          <p className="text-xs italic opacity-40">{conversation_meta.model}</p>
        </div>
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
