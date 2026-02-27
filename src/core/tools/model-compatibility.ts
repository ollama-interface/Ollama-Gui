export const TOOL_CALLING_SUPPORTED_MODELS = [
  "qwen2.5",
  "qwen2",
  "qwen",
  "mistral",
  "neural-chat",
  "dolphin-mixtral",
  "openchat",
  "llama3",
  "llama3.1",
  "command-r",
  "command-r-plus",
];

export const isModelToolCallSupported = (modelName: string): boolean => {
  if (!modelName) return false;

  const lowerModelName = modelName.toLowerCase();

  return TOOL_CALLING_SUPPORTED_MODELS.some((supported) =>
    lowerModelName.includes(supported.toLowerCase())
  );
};

export const getToolCallingSupportedModels = (): string[] => {
  return TOOL_CALLING_SUPPORTED_MODELS;
};

export const getToolCallingWarning = (modelName: string): string | null => {
  if (!isModelToolCallSupported(modelName)) {
    return `The model "${modelName}" does not support tool calling. Please use a model like Qwen, Mistral, Llama3, or Command-R for tool calling support.`;
  }
  return null;
};
