import { core } from "@/core";
import dayjs from "dayjs";
import { useSimple } from "simple-core-state";

export const ChatHeader = () => {
  const conv_meta = useSimple(core.focused_conv_meta);
  return (
    <div className="h-[50px] border-b-[1px] border-neutral-200 bg-neutral-50 w-full">
      <div className="flex justify-between items-center px-4 h-full ">
        <p className="text-sm">{conv_meta?.title}</p>
        {conv_meta.created_at && (
          <p className="text-neutral-500 opacity-50 text-sm italic">
            Created:{" "}
            {dayjs(conv_meta.created_at).format("MMM DD YYYY, HH:mm:ss a ")}
          </p>
        )}
      </div>
    </div>
  );
};
