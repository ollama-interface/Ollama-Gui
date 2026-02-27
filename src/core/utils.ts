import Axios from "axios";
import { core } from ".";

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
