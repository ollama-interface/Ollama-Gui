import { ChatHeader } from "./chat-header";
import { Input } from "@/components/ui/input";
import { useCallback, useState } from "react";
import {
  actions,
  core,
  generateIdNumber,
  generateRandomId,
  sendPrompt,
} from "@/core";
import { useSimple } from "simple-core-state";
import dayjs from "dayjs";
import { produce } from "immer";
import { ConversationMessage, ConversationMeta } from "@/core/types";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ChatWindow = () => {
  const conversations = useSimple(core.conversations);
  const conv_id = useSimple(core.focused_conv_id);
  const messages = useSimple(core.focused_conv_data);
  const conversation_meta = useSimple(core.focused_conv_meta);
  const available_models = useSimple(core.available_models);
  const last_used_model = useSimple(core.last_used_model);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesList = useCallback(() => {
    return messages;
  }, [messages, conv_id]);

  const changeModel = (model_name: string) => {
    // Update last used
    core.last_used_model.set(model_name);

    // Update the current conversation we are looking at
    core.focused_conv_meta.patchObject({ model: model_name });
  };

  const sendPromptMessage = useCallback(async () => {
    setLoading(true);

    // Check if we need to create a new conversation first
    if (!conv_id) {
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
    }

    let m = msg;
    let _conversation_id = conv_id;
    setMsg("");

    const v1 = {
      id: generateRandomId(12),
      conversation_id: _conversation_id,
      message: m,
      created_at: dayjs().toDate(),
      ai_replied: false,
      ctx: "",
    };

    // save the send prompt in db
    await actions.sendPrompt(v1);

    // Update the local state
    const messageCopy = [...messages];
    core.focused_conv_data.set(
      produce(messageCopy, (draft) => {
        draft.push(v1 as unknown as ConversationMessage);
      })
    );

    let lastCtx = [];
    if (messages.length > 1) {
      lastCtx = JSON.parse((messages[1].ctx as string) || "");
    }

    if (messages?.length === 0) {
      const x = msg?.slice(0, 20);
      core.focused_conv_meta.updatePiece("title", x);
      actions.updateConversationName(x, conversation_meta.id);
    }

    // send the promp the the ai
    const res = await sendPrompt({
      model: conversation_meta.model,
      prompt: m,
      context: lastCtx,
    });
    // TODO: we need to handle network error or any other...

    const v2 = {
      ai_replied: true,
      conversation_id: _conversation_id,
      created_at: dayjs().toDate(),
      id: generateRandomId(12),
      message: res.response,
      ctx: res.context,
    };

    // save the send prompt in db
    await actions.sendPrompt(v2);

    // Update the local state
    const messageCopy2 = [...messages];
    core.focused_conv_data.set(
      produce(messageCopy2, (draft) => {
        draft.push(v2 as unknown as ConversationMessage);
      })
    );

    setLoading(false);
  }, [
    msg,
    messages,
    conversations,
    last_used_model,
    conversation_meta,
    conv_id,
  ]);

  return (
    <div className="h-full">
      <ChatHeader />
      <div
        style={{ height: "calc(100% - 50px)" }}
        className="w-full bg-neutral-100 flex flex-col"
      >
        <div className="overflow-y-scroll flex flex-1 flex-col pt-4">
          {messages.length === 0 && (
            <div className="flex-row flex py-1 items-center pl-4">
              <p className="mr-2 text-sm">Select model: </p>
              <Select
                value={last_used_model}
                onValueChange={(v) => {
                  changeModel(v);
                }}
              >
                <SelectTrigger className="w-[180px] h-[30px] bg-white">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {available_models.map((item, index) => (
                    <SelectItem key={index} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(messagesList() || []).map((item) => (
            <ChatMessage {...item} key={item.id} />
          ))}
        </div>
        <div className="flex flex-row p-4 pt-0">
          <Input
            disabled={loading}
            className="bg-white rounded-full"
            placeholder="Type your prompt"
            onChange={(x) => setMsg(x.target.value)}
            value={msg}
            onKeyDown={(x) => {
              if (x.code === "Enter") {
                sendPromptMessage();
              }
            }}
          />
          <Button
            size="sm"
            className="ml-2 rounded-full text-sm h-full px-4"
            disabled={loading || msg === ""}
            onClick={sendPromptMessage}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
