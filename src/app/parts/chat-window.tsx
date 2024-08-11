import { ChatHeader } from "./chat-header";
import { Command } from "@tauri-apps/plugin-shell";
import { Input } from "@/components/ui/input";
import { useCallback, useState } from "react";
import { actions, core, generateRandomId, sendPrompt } from "@/core";
import { useSimple } from "simple-core-state";
import dayjs from "dayjs";
import { produce } from "immer";
import { ConversationMessage } from "@/core/types";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";

export const ChatWindow = () => {
  const conversations = useSimple(core.conversations);
  const conv_id = useSimple(core.focused_conv_id);
  const messages = useSimple(core.focused_conv_data);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function startServer() {
    let result = await Command.create("ollama-server", [
      "-c",
      "OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11434 ollama serve",
    ]).execute();
    console.log(result);
  }

  const sendPromptMessage = useCallback(async () => {
    setLoading(true);

    let m = msg;
    let _conversation_id = conv_id;
    setMsg("");

    const v1 = {
      ai_replied: false,
      conversation_id: _conversation_id,
      created_at: dayjs().toDate(),
      id: generateRandomId(12),
      message: m,
      ctx: null,
    };

    // save the send prompt in db
    actions.sendPrompt(v1);

    // Update the local state
    const messageCopy = [...messages];
    core.focused_conv_data.set(
      produce(messageCopy, (draft) => {
        draft.push(v1 as unknown as ConversationMessage);
      })
    );

    // Check if this is the first message we sent so we can update the conversation title
    if (messages?.length === 0 || !messages) {
      console.log("This is the first message of the conversations");

      actions.updateConversationName(m, _conversation_id);

      // core.focused_conv_meta.patchObject({ title: m });
      core.conversations.set(
        produce(conversations, (draft) => {
          const c = draft.find((x) => x.id === _conversation_id);
          c.title = m;
        })
      );
    }

    let lastCtx = [];
    if (messages.length > 1) {
      lastCtx = JSON.parse(messages[1].ctx);
    }

    // send the promp the the ai
    const res = await sendPrompt({
      model: "llama3",
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

    /// save the send prompt in db
    actions.sendPrompt(v2);

    // Update the local state
    const messageCopy2 = [...messages];
    core.focused_conv_data.set(
      produce(messageCopy2, (draft) => {
        draft.push(v2 as unknown as ConversationMessage);
      })
    );

    setLoading(false);
  }, [msg, messages, conversations]);

  return (
    <div className="h-full">
      <ChatHeader />
      <div
        style={{ height: "calc(100% - 50px)" }}
        className="w-full bg-neutral-100 p-4 flex flex-col"
      >
        <div className="overflow-y-scroll flex flex-1 flex-col">
          {!!messages?.length &&
            messages?.map((item, index) => (
              <ChatMessage {...item} key={index} />
            ))}
        </div>
        <div className="flex flex-row">
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
