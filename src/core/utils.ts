import Axios from 'axios';
import { core } from '.';

export const ollamaRequest = async (
  m: 'GET' | 'POST',
  path: string,
  c?: { data?: any }
) => {
  try {
    const res = await Axios({
      method: m,
      url: `${core.localAPI._value}/${path}`,
      data: c?.data,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const allomaGenerate = async (
  prompt: string,
  mdl: string,
  ctx?: number[]
) => {
  try {
    const res = await ollamaRequest('POST', 'api/generate', {
      data: {
        model: mdl,
        prompt: prompt,
        context: ctx,
      },
    });

    return res.data;
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
  const lines = inputText.trim().split('\n');
  const jsonArray = [];

  for (const line of lines) {
    const jsonObject = JSON.parse(line);
    jsonArray.push(jsonObject);
  }

  return jsonArray;
}
