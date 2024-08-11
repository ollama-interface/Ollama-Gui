import { core } from "@/core";
import dayjs from "dayjs";
import { useSimple } from "simple-core-state";

export const ChatHeader = () => {
  const conversation_meta = useSimple(core.focused_conv_meta);
  return (
    <div
      className="h-[50px] border-b-[1px] border-neutral-200 bg-neutral-50 w-full drag-window "
      data-tauri-drag-region
    >
      <div className="flex justify-between items-center px-4 h-full ">
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
                "MMM DD YYYY, HH:mm:ss a"
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
