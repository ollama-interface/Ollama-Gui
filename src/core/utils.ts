import Axios from "axios";
import { core } from ".";
import { Tool, ToolCall } from "./types";

export const ollamaRequest = async <T extends any>(
  m: "GET" | "POST" | "DELETE",
  path: string,
  c?: { data?: any },
): Promise<T> => {
  try {
    const res = await Axios({
      method: m,
      url: `${core.server_host._value}/${path}`,
      data: c?.data,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.data as T;
  } catch (error) {
    core.server_connected.set(false);
    throw error;
  }
};

export interface StreamResponse {
  response: string;
  context: number[];
  metrics?: {
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "tool" | "system";
  content?: string;
  tool_calls?: ToolCall[];
  tool_name?: string;
}

export interface ChatStreamResponse {
  message: {
    content: string;
    tool_calls?: ToolCall[];
  };
  metrics?: {
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  };
}

export type ToolCallCallback = (toolCall: ToolCall) => void;

export const ollamaStreamRequest = async (
  prompt: string,
  model: string,
  context?: number[],
  onChunk?: (chunk: string) => void,
): Promise<StreamResponse> => {
  try {
    const response = await fetch(`${core.server_host._value}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        context: context,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let fullResponse = "";
    let lastContext: number[] = [];
    const metrics: StreamResponse["metrics"] = {};
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              fullResponse += json.response;
              onChunk?.(json.response);
            }
            if (json.context) {
              lastContext = json.context;
            }
            // Capture metrics from the final response
            if (json.done) {
              metrics.total_duration = json.total_duration;
              metrics.load_duration = json.load_duration;
              metrics.prompt_eval_count = json.prompt_eval_count;
              metrics.prompt_eval_duration = json.prompt_eval_duration;
              metrics.eval_count = json.eval_count;
              metrics.eval_duration = json.eval_duration;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    return {
      response: fullResponse,
      context: lastContext,
      metrics,
    };
  } catch (error) {
    core.server_connected.set(false);
    throw error;
  }
};

export const ollamaChatRequest = async (
  messages: ChatMessage[],
  model: string,
  tools?: Tool[],
  onChunk?: (chunk: string) => void,
  onToolCall?: ToolCallCallback,
): Promise<ChatStreamResponse> => {
  try {
    const requestBody = {
      model: model,
      messages: messages,
      tools: tools,
      stream: true,
    };

    console.log("[Tool Calling] Sending request to /api/chat", {
      model,
      messagesCount: messages.length,
      toolsCount: tools?.length || 0,
      supportsStreaming: true,
      tools: tools?.map((t) => t.function.name) || [],
    });

    let response = await fetch(`${core.server_host._value}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // If /api/chat is not available (404), try /api/generate as fallback
    if (response.status === 404) {
      console.warn(
        "[Tool Calling] /api/chat not available (404), falling back to /api/generate - tool calling will NOT work",
      );

      // Convert messages to prompt format for /api/generate
      const prompt = messages
        .map((m) => {
          if (m.role === "user") return `User: ${m.content}`;
          if (m.role === "assistant") return `Assistant: ${m.content}`;
          if (m.role === "tool")
            return `Tool Result (${m.tool_name}): ${m.content}`;
          return m.content || "";
        })
        .join("\n\n");

      response = await fetch(`${core.server_host._value}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: true,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Tool Calling] API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      if (response.status === 404) {
        throw new Error(
          "Tool calling endpoint not available. Your Ollama version may not support /api/chat. Please ensure you have the latest Ollama version installed.",
        );
      }

      throw new Error(
        `Ollama API Error (${response.status}): ${errorText || response.statusText}`,
      );
    }

    let fullContent = "";
    let toolCalls: ToolCall[] = [];
    let currentToolCall: Partial<ToolCall> | null = null;
    const metrics: ChatStreamResponse["metrics"] = {};
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);

            // Handle streaming content
            if (json.message?.content) {
              fullContent += json.message.content;
              onChunk?.(json.message.content);
            }

            // Handle streaming tool calls
            if (json.message?.tool_calls) {
              // If we have a complete tool call from previous iteration, save it
              if (currentToolCall && currentToolCall.function) {
                toolCalls.push(currentToolCall as ToolCall);
                onToolCall?.(currentToolCall as ToolCall);
                console.log(
                  "[Tool Calling] Streaming tool call received:",
                  currentToolCall,
                );
              }

              // Start new tool call(s)
              const newToolCalls = json.message.tool_calls;
              if (Array.isArray(newToolCalls)) {
                for (const toolCall of newToolCalls) {
                  if (toolCall.function) {
                    currentToolCall = toolCall;
                    // If this is a complete tool call, add it
                    if (toolCall.function.name && toolCall.function.arguments) {
                      toolCalls.push(toolCall);
                      onToolCall?.(toolCall);
                      console.log(
                        "[Tool Calling] Tool call received:",
                        toolCall,
                      );
                      currentToolCall = null;
                    }
                  }
                }
              }
            }

            // Handle completion
            if (json.done) {
              // Save any remaining tool call
              if (currentToolCall && currentToolCall.function) {
                toolCalls.push(currentToolCall as ToolCall);
                onToolCall?.(currentToolCall as ToolCall);
              }

              metrics.total_duration = json.total_duration;
              metrics.load_duration = json.load_duration;
              metrics.prompt_eval_count = json.prompt_eval_count;
              metrics.prompt_eval_duration = json.prompt_eval_duration;
              metrics.eval_count = json.eval_count;
              metrics.eval_duration = json.eval_duration;

              console.log(
                "[Tool Calling] Stream completed with",
                toolCalls.length,
                "tool calls",
              );
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    return {
      message: {
        content: fullContent,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      },
      metrics,
    };
  } catch (error) {
    core.server_connected.set(false);
    throw error;
  }
};

export const allomaGenerate = async (
  prompt: string,
  mdl: string,
  ctx?: number[],
) => {
  try {
    const res = await ollamaRequest("POST", "api/generate", {
      data: {
        model: mdl,
        prompt: prompt,
        context: ctx,
      },
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export interface OllamaReturnObj {
  model: string;
  created_at: string;
  response: string;
  context?: number[];
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export function convertTextToJson(inputText: string): OllamaReturnObj[] {
  const lines = inputText.trim().split("\n");
  const jsonArray = [];

  for (const line of lines) {
    const jsonObject = JSON.parse(line);
    jsonArray.push(jsonObject);
  }

  return jsonArray;
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
export function trimWhitespace(str: string): string {
  return str.replace(/^[\s\xA0]+|[\s\xA0]+$/g, "");
}

export interface PullProgressEvent {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export const pullModel = async (
  modelName: string,
  onProgress?: (progress: PullProgressEvent) => void,
  signal?: AbortSignal,
): Promise<void> => {
  try {
    const response = await fetch(`${core.server_host._value}/api/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: modelName,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line) as PullProgressEvent;
            onProgress?.(json);
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Download was cancelled, don't set server_connected to false
      throw error;
    }
    core.server_connected.set(false);
    throw error;
  }
};

export interface BuildProgressEvent {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface ModelfileConfig {
  from: string;
  system?: string;
  template?: string;
  parameters?: Record<string, string | number>;
  adapter?: string;
  license?: string;
  messages?: Array<{ role: string; content: string }>;
  requires?: string;
}

export const buildModel = async (
  modelName: string,
  config: ModelfileConfig,
  onProgress?: (progress: BuildProgressEvent) => void,
  signal?: AbortSignal,
): Promise<void> => {
  try {
    const requestBody: Record<string, unknown> = {
      model: modelName,
      from: config.from,
      stream: true,
    };

    if (config.system) {
      requestBody.system = config.system;
    }
    if (config.template) {
      requestBody.template = config.template;
    }
    if (config.parameters && Object.keys(config.parameters).length > 0) {
      requestBody.parameters = config.parameters;
    }
    if (config.adapter) {
      requestBody.adapters = { adapter: config.adapter };
    }
    if (config.license) {
      requestBody.license = config.license;
    }
    if (config.messages && config.messages.length > 0) {
      requestBody.messages = config.messages;
    }
    if (config.requires) {
      requestBody.requires = config.requires;
    }

    const response = await fetch(`${core.server_host._value}/api/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line) as BuildProgressEvent;
            onProgress?.(json);
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    core.server_connected.set(false);
    throw error;
  }
};
