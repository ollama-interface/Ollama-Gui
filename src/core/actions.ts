import Axios from "axios";
import { core } from "./core";

interface sendProptOptions {
  prompt: string;
  model: string;
  context?: number[];
}
export const sendPrompt = async (p: sendProptOptions) => {
  try {
    const res = await Axios({
      method: "POST",
      url: `${core.localAPI._value}/api/generate`,
      data: {
        model: p.model,
        prompt: p.prompt,
        stream: false,
        context: p?.context,
      },
    });

    return res.data;
  } catch (error) {
    throw error;
  }
};
