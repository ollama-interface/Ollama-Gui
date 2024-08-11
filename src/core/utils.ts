import Axios from "axios";
import { core } from ".";

export const ollamaRequest = async <T extends any>(
  m: "GET" | "POST",
  path: string,
  c?: { data?: any }
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

export const allomaGenerate = async (
  prompt: string,
  mdl: string,
  ctx?: number[]
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
