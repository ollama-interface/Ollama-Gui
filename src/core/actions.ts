import Axios from "axios";
import { core } from "./core";
import {
  ollamaRequest,
  pullModel,
  PullProgressEvent,
  buildModel,
  BuildProgressEvent,
  ModelfileConfig,
} from "./utils";
import { IModelType, Modelfile } from "./types";

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
    })),
  );
};

export const downloadModel = async (
  modelName: string,
  onProgress?: (progress: PullProgressEvent) => void,
  signal?: AbortSignal,
) => {
  try {
    await pullModel(modelName, onProgress, signal);
    await syncModels();
  } catch (error) {
    throw error;
  }
};

export const deleteModel = async (modelName: string) => {
  try {
    await ollamaRequest("DELETE", `api/delete`, {
      data: {
        name: modelName,
      },
    });
    await syncModels();
  } catch (error) {
    throw error;
  }
};

export const buildModelFromFile = async (
  modelName: string,
  modelfile: Modelfile,
  onProgress?: (progress: BuildProgressEvent) => void,
  signal?: AbortSignal,
) => {
  try {
    const config: ModelfileConfig = {
      from: modelfile.from,
      system: modelfile.system,
      template: modelfile.template,
      adapter: modelfile.adapter,
      license: modelfile.license,
      requires: modelfile.requires,
    };

    if (modelfile.parameters && modelfile.parameters.length > 0) {
      config.parameters = {};
      for (const param of modelfile.parameters) {
        config.parameters[param.name] = param.value;
      }
    }

    if (modelfile.messages && modelfile.messages.length > 0) {
      config.messages = modelfile.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    await buildModel(modelName, config, onProgress, signal);
    await syncModels();
  } catch (error) {
    throw error;
  }
};

export const convertModelfileToString = (modelfile: Modelfile): string => {
  let content = `FROM ${modelfile.from}\n`;

  if (modelfile.parameters && modelfile.parameters.length > 0) {
    for (const param of modelfile.parameters) {
      content += `PARAMETER ${param.name} ${param.value}\n`;
    }
  }

  if (modelfile.template) {
    content += `TEMPLATE """${modelfile.template}"""\n`;
  }

  if (modelfile.system) {
    content += `SYSTEM """${modelfile.system}"""\n`;
  }

  if (modelfile.adapter) {
    content += `ADAPTER ${modelfile.adapter}\n`;
  }

  if (modelfile.license) {
    content += `LICENSE """${modelfile.license}"""\n`;
  }

  if (modelfile.messages && modelfile.messages.length > 0) {
    for (const msg of modelfile.messages) {
      content += `MESSAGE ${msg.role} ${msg.content}\n`;
    }
  }

  if (modelfile.requires) {
    content += `REQUIRES ${modelfile.requires}\n`;
  }

  return content;
};
