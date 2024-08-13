import { Button } from "@/components/ui/button";
import { actions, core, generateIdNumber, generateRandomId } from "@/core";
import { ConversationMeta } from "@/core/types";
import { GearIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { produce } from "immer";
import { useSimple } from "simple-core-state";
import { twMerge } from "tailwind-merge";

export const Sidebar = () => {
  const convs = useSimple(core.conversations);
  const focused_conv_id = useSimple(core.focused_conv_id);
  const last_used_model = useSimple(core.last_used_model);
  const server_connected = useSimple(core.server_connected);
  const server_host = useSimple(core.server_host);

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
      })
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

  return (
    <div className="flex flex-col w-[340px] border-r-[1px] border-solid border-r-neutral-200">
      <div className="p-4">
        <div className="flex-row flex ">
          <p className="text-xs font-medium">Status: </p>
          <p
            className={twMerge(
              "text-xs font-medium ml-1",
              server_connected ? "text-green-700" : "text-red-700"
            )}
          >
            {server_connected ? "Connected" : "Disconnected"}
          </p>
        </div>
        <p className="text-xs opacity-50">{server_host}</p>
      </div>
      <div className="p-4 w-full flex-row flex">
        <Button className="w-full" onClick={newConversation} variant="outline">
          New Conversation
        </Button>
        <Button
          variant="outline"
          className="ml-2"
          onClick={() => core._events.trigger_settings.send()}
        >
          <GearIcon />
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden w-full">
        <div className="p-4 h-full overflow-y-auto w-full" style={{}}>
          {!!convs?.length &&
            convs?.map((item, index) => (
              <div
                className={twMerge(
                  "mb-2 py-2 px-4 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer",
                  focused_conv_id === item?.id ? "bg-neutral-100" : ""
                )}
                key={index}
                onClick={() => loadConversation(item)}
              >
                <p className="select-none">{item.title}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
