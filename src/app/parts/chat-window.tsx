import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { useCallback, useState, useRef, useEffect } from "react";
import {
  actions,
  core,
  generateIdNumber,
  generateRandomId,
  sendPrompt,
  syncModels,
  downloadModel,
} from "@/core";
import { ollamaStreamRequest, PullProgressEvent } from "@/core/utils";
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
import { ModelDownloadDialog } from "./model-download-dialog";
import { ResponseMetrics } from "./response-metrics";

export const ChatWindow = () => {
  const conversations = useSimple(core.conversations);
  const conv_id = useSimple(core.focused_conv_id);
  const messages = useSimple(core.focused_conv_data);
  const conversation_meta = useSimple(core.focused_conv_meta);
  const available_models = useSimple(core.available_models);
  const last_used_model = useSimple(core.last_used_model);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadStats, setDownloadStats] = useState<{
    completed?: number;
    total?: number;
  }>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const messagesList = useCallback(() => {
    return messages;
  }, [messages, conv_id]);

  // TODO: We need to move this function to a life cycle for auto restart feature
  // async function startServer() {
  //   let result = await Command.create("ollama-server", [
  //     "-c",
  //     "OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11434 ollama serve",
  //   ]).execute();
  //   console.log(result);
  // }

  const changeModel = (model_name: string) => {
    // Update last used
    core.last_used_model.set(model_name);

    // Update the current conversation we are looking at
    if (conversation_meta?.id) {
      core.focused_conv_meta.patchObject({ model: model_name });
    }
  };

  const refreshModels = async () => {
    try {
      await syncModels();
    } catch (error) {
      console.error("Failed to refresh models:", error);
    }
  };

  const handleDownloadModel = async (modelName: string) => {
    setDownloadingModel(modelName);
    setDownloadDialogOpen(true);
    setDownloadProgress(0);
    setDownloadStatus("Initializing...");
    setDownloadStats({});

    abortControllerRef.current = new AbortController();

    try {
      await downloadModel(
        modelName,
        (progress: PullProgressEvent) => {
          setDownloadStatus(progress.status || "Downloading...");

          if (
            progress.completed !== undefined &&
            progress.total !== undefined
          ) {
            const percent = (progress.completed / progress.total) * 100;
            setDownloadProgress(percent);
            setDownloadStats({
              completed: progress.completed,
              total: progress.total,
            });
          }
        },
        abortControllerRef.current.signal,
      );

      setDownloadProgress(100);
      setDownloadStatus("Download complete!");
      setTimeout(() => {
        setDownloadDialogOpen(false);
      }, 1500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setDownloadStatus("Download cancelled");
      } else {
        console.error("Failed to download model:", error);
        setDownloadStatus("Download failed");
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setDownloadDialogOpen(false);
    }
  };

  const sendPromptMessage = useCallback(async () => {
    setLoading(true);

    let _conversation_id = conv_id;
    let _model = conversation_meta?.model || last_used_model;
    let _messages = messages;

    // Check if we need to create a new conversation first
    if (!conv_id) {
      const v = {
        id: generateRandomId(12),
        created_at: dayjs().toDate(),
        model: last_used_model,
        title: "Conversation " + generateIdNumber(2),
      };

      try {
        await actions.createConversation(v);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        setLoading(false);
        return;
      }

      core.conversations.set(
        produce((draft) => {
          draft.push(v as unknown as ConversationMeta);
        }),
      );

      core.focused_conv_id.set(v.id);
      core.focused_conv_meta.set(v);
      core.focused_conv_data.set([]);
      _conversation_id = v.id;
      _model = v.model;
      _messages = [];
    }

    core.streaming_conv_id.set(_conversation_id);

    let m = msg;
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

    // Update the local state with proper type
    const v1ForState: ConversationMessage = {
      id: v1.id,
      conversation_id: v1.conversation_id,
      message: v1.message,
      created_at: dayjs(v1.created_at).toISOString(),
      ai_replied: v1.ai_replied,
      ctx: v1.ctx,
    };

    const updatedMessages = [..._messages, v1ForState];
    core.focused_conv_data.set(updatedMessages);

    let lastCtx = [];
    if (updatedMessages.length > 1) {
      lastCtx = JSON.parse((updatedMessages[1].ctx as string) || "");
    }

    if (updatedMessages?.length === 1) {
      const x = msg?.slice(0, 20);
      core.focused_conv_meta.updatePiece("title", x);
      core.conversations.set(
        produce((draft) => {
          const convIndex = draft.findIndex((c) => c.id === _conversation_id);
          if (convIndex !== -1) {
            draft[convIndex].title = x;
          }
        }),
      );
      actions.updateConversationName(x, _conversation_id);
    }

    // Create AI response message with streaming
    const aiMessageId = generateRandomId(12);
    const v2 = {
      ai_replied: true,
      conversation_id: _conversation_id,
      created_at: dayjs().toDate(),
      id: aiMessageId,
      message: "",
      ctx: [],
    };

    // Add empty AI message to UI first
    const messageCopy2 = [...updatedMessages];
    core.focused_conv_data.set(
      produce(messageCopy2, (draft) => {
        draft.push(v2 as unknown as ConversationMessage);
      }),
    );

    try {
      // Stream the response from Ollama
      const res = await ollamaStreamRequest(m, _model, lastCtx, (chunk) => {
        // Update the message in real-time as chunks arrive
        core.focused_conv_data.set(
          produce((draft) => {
            const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
            if (msgIndex !== -1) {
              draft[msgIndex].message += chunk;
            }
          }),
        );
      });

      // Update final message with context and metrics
      core.focused_conv_data.set(
        produce((draft) => {
          const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
          if (msgIndex !== -1) {
            draft[msgIndex].message = res.response;
            draft[msgIndex].ctx = JSON.stringify(res.context);
            draft[msgIndex].metrics = res.metrics;
          }
        }),
      );

      // Save the complete response to database
      await actions.sendPrompt({
        id: aiMessageId,
        conversation_id: _conversation_id,
        message: res.response,
        created_at: dayjs().toDate(),
        ai_replied: true,
        ctx: JSON.stringify(res.context),
        metrics: res.metrics,
      });
    } catch (error) {
      console.error("Error streaming response:", error);
      // Update message to show error
      core.focused_conv_data.set(
        produce((draft) => {
          const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
          if (msgIndex !== -1) {
            draft[msgIndex].message =
              "Error: Failed to get response from Ollama";
          }
        }),
      );
    }

    core.streaming_conv_id.set("");
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
            <div className="flex-col flex pl-4 mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Models Manager</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={last_used_model}
                  onValueChange={(v) => {
                    changeModel(v);
                  }}
                >
                  <SelectTrigger className="w-[200px] h-[32px] bg-white">
                    <SelectValue placeholder="Choose a model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {available_models.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50">
                          Installed
                        </div>
                        {available_models.map((item, index) => (
                          <SelectItem
                            key={`installed-${index}`}
                            value={item.name}
                          >
                            {item.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50">
                      Available to Download
                    </div>
                    {[
                      "llama2",
                      "mistral",
                      "neural-chat",
                      "starling-lm",
                      "dolphin-mixtral",
                      "openchat",
                    ].map((model, index) => (
                      <SelectItem key={`download-${index}`} value={model}>
                        <span className="text-gray-500">{model}</span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-2 text-xs text-center">
                      <button
                        onClick={() => window.open("https://ollama.ai/library")}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View all models
                      </button>
                    </div>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-[32px] px-3 text-xs"
                  onClick={refreshModels}
                >
                  Refresh
                </Button>
              </div>
              {available_models.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No models installed.{" "}
                  <button
                    onClick={() => window.open("https://ollama.ai/library")}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Download models
                  </button>
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Installed ({available_models.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {available_models.map((model, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700"
                        >
                          {model.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Download Models:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "llama2",
                        "mistral",
                        "neural-chat",
                        "starling-lm",
                        "dolphin-mixtral",
                        "openchat",
                      ].map((model) => (
                        <Button
                          key={model}
                          size="sm"
                          variant="outline"
                          className="h-[28px] px-2 text-xs"
                          onClick={() => handleDownloadModel(model)}
                        >
                          ↓ {model}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => window.open("https://ollama.ai/library")}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    View all models
                  </button>
                </div>
              )}
            </div>
          )}
          {(messagesList() || []).map((item) => (
            <ChatMessage {...item} key={item.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex flex-col p-4 pt-0">
          <ChatInput
            value={msg}
            onChange={setMsg}
            onSend={sendPromptMessage}
            disabled={loading}
            placeholder="Type your prompt... (Shift+Enter for new line)"
          />
        </div>
      </div>
      <ModelDownloadDialog
        isOpen={downloadDialogOpen}
        modelName={downloadingModel}
        isDownloading={downloadDialogOpen && downloadProgress < 100}
        progress={downloadProgress}
        status={downloadStatus}
        completed={downloadStats.completed}
        total={downloadStats.total}
        onClose={() => setDownloadDialogOpen(false)}
        onCancel={handleCancelDownload}
      />
    </div>
  );
};
