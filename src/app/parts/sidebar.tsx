import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, core, generateRandomId } from "@/core";
import {
  ConversationMessage,
  ConversationMessages,
  IConversationType,
} from "@/core/types";
import { GearIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { produce } from "immer";
import { useSimple } from "simple-core-state";
import { twMerge } from "tailwind-merge";

export const Sidebar = () => {
  const convs = useSimple(core.conversations);
  const focused_conv_id = useSimple(core.focused_conv_id);

  const newConversation = () => {
    const v = {
      id: generateRandomId(12),
      created_at: dayjs().toDate(),
      model: "llama3",
      title: "Somethign",
    };
    actions.createConversation(v);

    core.conversations.set(
      produce((draft) => {
        draft.push(v as unknown as IConversationType);
      })
    );

    core.focused_conv_id.set(v.id);
    core.focused_conv_meta.set(v);
    core.focused_conv_data.set([]);
  };

  const loadConversation = async (conv: IConversationType) => {
    // set data
    core.focused_conv_id.set(conv.id);
    core.focused_conv_meta.set(conv);

    // Get messages from the conversation
    const res = (await actions.getConversationMessages(
      conv.id
    )) as ConversationMessages;
    core.focused_conv_data.set(res || []);
  };

  return (
    <div className="flex flex-col w-[340px] border-r-[1px] border-solid border-r-neutral-200">
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
