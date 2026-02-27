import { Button } from "@/components/ui/button";
import { actions, core, generateIdNumber, generateRandomId } from "@/core";
import { ConversationMeta, Tool } from "@/core/types";
import { GearIcon, TrashIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { produce } from "immer";
import { useSimple } from "simple-core-state";
import { twMerge } from "tailwind-merge";
import {
  Plus,
  Settings,
  Loader,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Package,
} from "lucide-react";
import { OllamaStatusIndicator } from "./ollama-status";
import { useState } from "react";

interface SidebarProps {
  onManageModels?: () => void;
  onSettings?: () => void;
  onToolCalling?: () => void;
  onCloseModals?: () => void;
}

export const Sidebar = ({
  onManageModels,
  onSettings,
  onToolCalling,
  onCloseModals,
}: SidebarProps) => {
  const convs = useSimple(core.conversations);
  const focused_conv_id = useSimple(core.focused_conv_id);
  const last_used_model = useSimple(core.last_used_model);
  const streaming_conv_id = useSimple(core.streaming_conv_id);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const newConversation = () => {
    onCloseModals?.();

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
    onCloseModals?.();

    // set data
    core.focused_conv_id.set(conv.id);
    core.focused_conv_meta.set(conv);

    // Get messages from the conversation
    const res = await actions.getConversationMessages(conv.id);

    core.focused_conv_data.set(res as any);
  };

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await actions.deleteConversation(convId);

      if (focused_conv_id === convId) {
        core.focused_conv_id.reset();
        core.focused_conv_meta.reset();
        core.focused_conv_data.reset();
      }

      core.conversations.set(
        produce((draft) => {
          return draft.filter((c) => c.id !== convId);
        }),
      );
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  return (
    <div className="relative h-full">
      <div
        className={`relative flex flex-col border-r border-gray-200 bg-white h-full transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-[340px]"
        }`}
      >
        {/* Header */}
        <div
          className={`border-b border-gray-200 ${isCollapsed ? "p-2 space-y-1" : "p-4 space-y-3"}`}
        >
          <Button
            onClick={newConversation}
            className={`gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${
              isCollapsed
                ? "w-12 h-12 p-0 flex items-center justify-center"
                : "w-full"
            }`}
            title={isCollapsed ? "New Conversation" : ""}
          >
            <Plus size={16} />
            {!isCollapsed && "New Conversation"}
          </Button>
          <div className={`flex flex-col ${isCollapsed ? "gap-1" : "gap-2"}`}>
            <Button
              variant="outline"
              className={`gap-2 rounded-lg border-gray-300 ${isCollapsed ? "w-12 h-12 p-0 flex items-center justify-center" : "w-full justify-start"}`}
              onClick={onManageModels}
              title={isCollapsed ? "Models" : ""}
            >
              <Package size={16} />
              {!isCollapsed && "Models"}
            </Button>
            <div className={`relative ${isCollapsed ? "" : "w-full"}`}>
              <Button
                variant="outline"
                className={`gap-2 rounded-lg border-gray-300 ${isCollapsed ? "w-12 h-12 p-0 flex items-center justify-center" : "w-full justify-start"}`}
                onClick={onToolCalling}
                title={isCollapsed ? "Tool Calling" : ""}
              >
                <Wrench size={16} />
                {!isCollapsed && "Tool Calling"}
              </Button>
              {!isCollapsed && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                  Exp
                </span>
              )}
            </div>
            <Button
              variant="outline"
              className={`gap-2 rounded-lg border-gray-300 ${isCollapsed ? "w-12 h-12 p-0 flex items-center justify-center" : "w-full justify-start"}`}
              onClick={onSettings}
              title={isCollapsed ? "Settings" : ""}
            >
              <Settings size={16} />
              {!isCollapsed && "Settings"}
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex flex-1 overflow-hidden w-full">
          <div
            className={`h-full overflow-y-auto w-full ${isCollapsed ? "p-2" : "p-3"}`}
          >
            {!convs?.length ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-gray-500 text-sm">
                    {isCollapsed ? "No chats" : "No conversations yet"}
                  </p>
                  {!isCollapsed && (
                    <p className="text-gray-400 text-xs mt-1">
                      Start a new conversation to begin
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {convs?.map((item, index) => (
                  <div
                    key={index}
                    className={twMerge(
                      "group rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-between",
                      isCollapsed
                        ? "w-12 h-12 p-0 flex items-center justify-center"
                        : "py-3 px-3",
                      focused_conv_id === item?.id
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200",
                    )}
                    onClick={() => loadConversation(item)}
                    title={isCollapsed ? item.title : ""}
                  >
                    {isCollapsed ? (
                      <div className="text-center">
                        <p className="select-none text-xs font-medium text-gray-900">
                          {index + 1}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="select-none text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.model}
                        </p>
                      </div>
                    )}
                    {streaming_conv_id === item.id ? (
                      <div className={isCollapsed ? "" : "ml-2"}>
                        <Loader
                          size={16}
                          className="animate-spin text-blue-600"
                        />
                      </div>
                    ) : (
                      !isCollapsed && (
                        <button
                          onClick={(e) => deleteConversation(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <TrashIcon width={16} height={16} />
                        </button>
                      )
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

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-100 transition-colors z-10"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );
};
