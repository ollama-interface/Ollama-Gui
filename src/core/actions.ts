import Axios from "axios";
import { core } from "./core";
import { ollamaRequest } from "./utils";
import { IModelType } from "./types";

interface sendProptOptions {
  prompt: string;
  model: string;
  context?: number[];
}

export const sendPrompt = async (p: sendProptOptions) => {
  try {
    const res = await Axios({
      method: "POST",
      url: `${core.server_host._value}/api/generate`,
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

export const syncModels = async () => {
  const res = await ollamaRequest<{ models: IModelType[] }>("GET", "api/tags");

  core.available_models.set(
    res.models.map((item) => ({
      name: item.name,
      digest: item.digest,
      modified_at: item.modified_at,
      size: item.size,
    }))
  );
};
