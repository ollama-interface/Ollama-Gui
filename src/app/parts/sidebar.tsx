import { Button } from "@/components/ui/button";
import { actions, core, generateIdNumber, generateRandomId } from "@/core";
import { ConversationMeta } from "@/core/types";
import { GearIcon, TrashIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { produce } from "immer";
import { useSimple } from "simple-core-state";
import { twMerge } from "tailwind-merge";
import { Plus, Settings, Loader } from "lucide-react";
import { OllamaStatusIndicator } from "./ollama-status";

export const Sidebar = () => {
  const convs = useSimple(core.conversations);
  const focused_conv_id = useSimple(core.focused_conv_id);
  const last_used_model = useSimple(core.last_used_model);
  const streaming_conv_id = useSimple(core.streaming_conv_id);

  const newConversation = () => {
    const v = {
      id: generateRandomId(12),
      created_at: dayjs().toDate(),
      model: last_used_model,
      title: "Conversation " + generateIdNumber(2),
    };
    actions.createConversation(v);

    core.conversations.set(
      produce((draft) => {
        draft.push(v as unknown as ConversationMeta);
      }),
    );

    core.focused_conv_id.set(v.id);
    core.focused_conv_meta.set(v);
    core.focused_conv_data.set([]);
  };

  const loadConversation = async (conv: ConversationMeta) => {
    // set data
    core.focused_conv_id.set(conv.id);
    core.focused_conv_meta.set(conv);

    // Get messages from the conversation
    const res = await actions.getConversationMessages(conv.id);

    core.focused_conv_data.set(res as any);
  };

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    await actions.deleteConversation(convId);
    core.conversations.set(
      produce((draft) => {
        return draft.filter((c) => c.id !== convId);
      }),
    );
    if (focused_conv_id === convId) {
      core.focused_conv_id.reset();
      core.focused_conv_meta.reset();
      core.focused_conv_data.reset();
    }
  };

  return (
    <div className="flex flex-col w-[340px] border-r border-gray-200 bg-white h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <Button
          onClick={newConversation}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus size={18} />
          New Conversation
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2 rounded-lg border-gray-300"
          onClick={() => core._events.trigger_settings.send()}
        >
          <Settings size={18} />
          Settings
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex flex-1 overflow-hidden w-full">
        <div className="p-3 h-full overflow-y-auto w-full">
          {!convs?.length ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Start a new conversation to begin
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {convs?.map((item, index) => (
                <div
                  key={index}
                  className={twMerge(
                    "group py-3 px-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-between",
                    focused_conv_id === item?.id
                      ? "bg-blue-50 border border-blue-200"
                      : "border border-transparent",
                  )}
                  onClick={() => loadConversation(item)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="select-none text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.model}</p>
                  </div>
                  {streaming_conv_id === item.id ? (
                    <div className="ml-2 p-1">
                      <Loader
                        size={16}
                        className="animate-spin text-blue-600"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => deleteConversation(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ollama Status */}
      <OllamaStatusIndicator />
    </div>
  );
};
