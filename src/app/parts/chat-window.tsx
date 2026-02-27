import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { useCallback, useState, useRef, useEffect } from "react";
import {
  actions,
  core,
  generateIdNumber,
  generateRandomId,
  sendPrompt,
} from "@/core";
import {
  ollamaStreamRequest,
  ollamaChatRequest,
  ChatMessage as ChatMessageType,
} from "@/core/utils";
import { useSimple } from "simple-core-state";
import dayjs from "dayjs";
import { produce } from "immer";
import {
  ConversationMessage,
  ConversationMeta,
  Tool,
  ToolCall,
  ToolResult,
} from "@/core/types";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponseMetrics } from "./response-metrics";
import { ToolLibrarySelector } from "./tool-library-selector";
import { ToolCallsDisplay } from "./tool-call-display";
import { DatabaseConnectionManager } from "./database-connection-manager";
import {
  isModelToolCallSupported,
  getToolCallingWarning,
  createDatabaseToolExecutor,
} from "@/core/tools";

export const ChatWindow = () => {
  const conversations = useSimple(core.conversations);
  const conv_id = useSimple(core.focused_conv_id);
  const messages = useSimple(core.focused_conv_data);
  const conversation_meta = useSimple(core.focused_conv_meta);
  const available_models = useSimple(core.available_models);
  const last_used_model = useSimple(core.last_used_model);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [pendingToolCalls, setPendingToolCalls] = useState<ToolCall[]>([]);
  const [useToolCalling, setUseToolCalling] = useState(false);
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

  const handleToolResultsSubmit = useCallback(
    async (results: ToolResult[]) => {
      if (pendingToolCalls.length === 0) return;

      setLoading(true);
      const _conversation_id = conv_id;
      const _model = conversation_meta?.model || last_used_model;

      try {
        const chatMessages: ChatMessageType[] = messages.map((msg) => ({
          role: msg.ai_replied ? "assistant" : "user",
          content: msg.message,
          tool_calls: msg.tool_calls,
        }));

        let finalContent = "";

        for (const result of results) {
          chatMessages.push({
            role: "tool",
            tool_name: result.tool_name,
            content: result.content,
          });
        }

        const res = await ollamaChatRequest(
          chatMessages,
          _model,
          tools.length > 0 ? tools : undefined,
          (chunk) => {
            finalContent += chunk;
          },
        );

        const toolResultMessageId = generateRandomId(12);
        const toolResultMessage: ConversationMessage = {
          id: toolResultMessageId,
          conversation_id: _conversation_id,
          message: res.message.content,
          created_at: dayjs().toISOString(),
          ai_replied: true,
          ctx: "{}",
          tool_results: results,
          metrics: res.metrics,
        };

        core.focused_conv_data.set(
          produce((draft) => {
            draft.push(toolResultMessage);
          }),
        );

        await actions.sendPrompt({
          id: toolResultMessageId,
          conversation_id: _conversation_id,
          message: res.message.content,
          created_at: dayjs().toDate(),
          ai_replied: true,
          ctx: "{}",
          tool_results: JSON.stringify(results),
          metrics: res.metrics,
        });

        setPendingToolCalls([]);
      } catch (error) {
        console.error("Error submitting tool results:", error);
      }

      setLoading(false);
    },
    [
      pendingToolCalls,
      messages,
      conv_id,
      conversation_meta,
      last_used_model,
      tools,
    ],
  );

  const sendPromptMessageWithTools = useCallback(async () => {
    setLoading(true);

    let _conversation_id = conv_id;
    let _model = conversation_meta?.model || last_used_model;
    let _messages = messages;

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

    await actions.sendPrompt(v1);

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

    if (updatedMessages?.length === 1) {
      const x = m?.slice(0, 20);
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

    const aiMessageId = generateRandomId(12);
    const v2 = {
      ai_replied: true,
      conversation_id: _conversation_id,
      created_at: dayjs().toDate(),
      id: aiMessageId,
      message: "",
      ctx: [],
      tool_calls: [],
    };

    const messageCopy2 = [...updatedMessages];
    core.focused_conv_data.set(
      produce(messageCopy2, (draft) => {
        draft.push(v2 as unknown as ConversationMessage);
      }),
    );

    try {
      const chatMessages: ChatMessageType[] = updatedMessages.map((msg) => ({
        role: msg.ai_replied ? "assistant" : "user",
        content: msg.message,
      }));

      // If tools are enabled, add a system message to force tool usage
      if (useToolCalling && tools.length > 0) {
        const toolDescriptions = tools
          .map((t) => `- ${t.function.name}: ${t.function.description}`)
          .join("\n");

        chatMessages.unshift({
          role: "system",
          content: `You are a database assistant. You MUST use tools to answer questions about data.

Available tools:
${toolDescriptions}

CRITICAL RULES:
1. You MUST call a tool for ANY question about data, tables, or database content
2. NEVER describe what you would do - ALWAYS actually call the tool
3. NEVER make up data or provide generic responses
4. NEVER respond without using a tool when tools are available
5. For data queries: use execute_query
6. For schema questions: use get_database_schema
7. For multiple operations: use execute_transaction
8. Always provide the actual tool results to the user

Remember: You MUST use tools. Do not explain what tools do - USE THEM.`,
        });
      }

      const res = await ollamaChatRequest(
        chatMessages,
        _model,
        useToolCalling && tools.length > 0 ? tools : undefined,
        (chunk) => {
          core.focused_conv_data.set(
            produce((draft) => {
              const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
              if (msgIndex !== -1) {
                draft[msgIndex].message += chunk;
              }
            }),
          );
        },
        (toolCall) => {
          console.log("[Chat Window] Streaming tool call received:", toolCall);
          core.focused_conv_data.set(
            produce((draft) => {
              const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
              if (msgIndex !== -1) {
                if (!draft[msgIndex].tool_calls) {
                  draft[msgIndex].tool_calls = [];
                }
                const existingIndex = draft[msgIndex].tool_calls!.findIndex(
                  (tc) =>
                    tc.function.name === toolCall.function.name &&
                    tc.function.index === toolCall.function.index,
                );
                if (existingIndex === -1) {
                  draft[msgIndex].tool_calls!.push(toolCall);
                } else {
                  draft[msgIndex].tool_calls![existingIndex] = toolCall;
                }
              }
            }),
          );
        },
      );

      if (res.message.tool_calls && res.message.tool_calls.length > 0) {
        core.focused_conv_data.set(
          produce((draft) => {
            const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
            if (msgIndex !== -1) {
              draft[msgIndex].message = res.message.content;
              draft[msgIndex].tool_calls = res.message.tool_calls;
              draft[msgIndex].metrics = res.metrics;
            }
          }),
        );

        await actions.sendPrompt({
          id: aiMessageId,
          conversation_id: _conversation_id,
          message: res.message.content,
          created_at: dayjs().toDate(),
          ai_replied: true,
          ctx: "{}",
          tool_calls: JSON.stringify(res.message.tool_calls),
          metrics: res.metrics,
        });

        const toolExecutor = createDatabaseToolExecutor();
        const toolResults: ToolResult[] = [];

        console.log(
          "[Tool Execution] Starting tool execution for",
          res.message.tool_calls?.length || 0,
          "tools",
        );

        for (const toolCall of res.message.tool_calls) {
          try {
            console.log(
              "[Tool Execution] Executing tool:",
              toolCall.function.name,
              "with args:",
              toolCall.function.arguments,
            );
            const result = await toolExecutor(
              toolCall.function.name,
              toolCall.function.arguments,
            );
            console.log("[Tool Execution] Tool result:", result);
            toolResults.push({
              tool_name: toolCall.function.name,
              content: result,
            });
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            console.error("[Tool Execution] Tool error:", errorMsg);
            toolResults.push({
              tool_name: toolCall.function.name,
              content: `Error: ${errorMsg}`,
            });
          }
        }

        console.log(
          "[Tool Execution] All tools executed. Results:",
          toolResults,
        );

        const chatMessages: ChatMessageType[] = updatedMessages.map((msg) => ({
          role: msg.ai_replied ? "assistant" : "user",
          content: msg.message,
          tool_calls: msg.tool_calls,
        }));

        for (const result of toolResults) {
          chatMessages.push({
            role: "tool",
            tool_name: result.tool_name,
            content: result.content,
          });
        }

        console.log(
          "[Tool Execution] Sending follow-up request to model with",
          chatMessages.length,
          "messages",
        );

        try {
          const followUpRes = await ollamaChatRequest(
            chatMessages,
            _model,
            tools.length > 0 ? tools : undefined,
            (chunk) => {
              console.log(
                "[Tool Execution] Received chunk:",
                chunk.substring(0, 50),
              );
              core.focused_conv_data.set(
                produce((draft) => {
                  const msgIndex = draft.findIndex(
                    (msg) => msg.id === aiMessageId,
                  );
                  if (msgIndex !== -1) {
                    draft[msgIndex].message += chunk;
                  }
                }),
              );
            },
          );

          console.log(
            "[Tool Execution] Follow-up response received:",
            followUpRes.message.content.substring(0, 100),
          );

          core.focused_conv_data.set(
            produce((draft) => {
              const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
              if (msgIndex !== -1) {
                draft[msgIndex].message = followUpRes.message.content;
                draft[msgIndex].tool_results = toolResults;
                draft[msgIndex].metrics = followUpRes.metrics;
              }
            }),
          );

          await actions.sendPrompt({
            id: aiMessageId,
            conversation_id: _conversation_id,
            message: followUpRes.message.content,
            created_at: dayjs().toDate(),
            ai_replied: true,
            ctx: "{}",
            tool_results: JSON.stringify(toolResults),
            metrics: followUpRes.metrics,
          });
        } catch (followUpError) {
          const followUpErrorMsg =
            followUpError instanceof Error
              ? followUpError.message
              : String(followUpError);
          console.error(
            "[Tool Execution] Follow-up request failed:",
            followUpErrorMsg,
          );

          core.focused_conv_data.set(
            produce((draft) => {
              const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
              if (msgIndex !== -1) {
                draft[msgIndex].message =
                  `Tool executed successfully but failed to get follow-up response: ${followUpErrorMsg}`;
                draft[msgIndex].tool_results = toolResults;
              }
            }),
          );
        }
      } else {
        core.focused_conv_data.set(
          produce((draft) => {
            const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
            if (msgIndex !== -1) {
              draft[msgIndex].message = res.message.content;
              draft[msgIndex].metrics = res.metrics;
            }
          }),
        );

        await actions.sendPrompt({
          id: aiMessageId,
          conversation_id: _conversation_id,
          message: res.message.content,
          created_at: dayjs().toDate(),
          ai_replied: true,
          ctx: "{}",
          metrics: res.metrics,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error streaming response:", error);
      core.focused_conv_data.set(
        produce((draft) => {
          const msgIndex = draft.findIndex((msg) => msg.id === aiMessageId);
          if (msgIndex !== -1) {
            draft[msgIndex].message = `Error: ${errorMsg}`;
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
    tools,
  ]);

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
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Model
                  </label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Tool Calling</p>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                    Experimental
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (
                      !useToolCalling &&
                      !isModelToolCallSupported(last_used_model)
                    ) {
                      alert(`⚠️ ${getToolCallingWarning(last_used_model)}`);
                      return;
                    }
                    setUseToolCalling(!useToolCalling);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useToolCalling ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  title={
                    useToolCalling
                      ? "Disable Tool Calling"
                      : "Enable Tool Calling"
                  }
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useToolCalling ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {useToolCalling && !isModelToolCallSupported(last_used_model) && (
                <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <p className="font-medium mb-1">⚠️ Model Not Supported</p>
                  <p>{getToolCallingWarning(last_used_model)}</p>
                </div>
              )}
              {useToolCalling && (
                <div className="space-y-3">
                  <div className="px-4 py-3 bg-white rounded border">
                    <DatabaseConnectionManager />
                  </div>
                  <div className="px-4 py-3 bg-white rounded border">
                    <ToolLibrarySelector
                      selectedTools={tools}
                      onToolsChange={setTools}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {pendingToolCalls.length > 0 && (
            <div className="px-4 py-3 space-y-2">
              <ToolCallsDisplay
                toolCalls={pendingToolCalls}
                isLoading={loading}
                onResultsSubmit={handleToolResultsSubmit}
              />
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
            onSend={
              useToolCalling ? sendPromptMessageWithTools : sendPromptMessage
            }
            disabled={loading}
            placeholder="Type your prompt... (Shift+Enter for new line)"
          />
        </div>
      </div>
    </div>
  );
};
