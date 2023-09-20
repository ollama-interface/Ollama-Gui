export type ModelTypes =
  | 'llama2'
  | 'llama2:13b'
  | 'llama2:70b'
  | 'llama2:uncensored'
  | 'codellama'
  | 'orca-mini';

export type ICoreType = {
  conversations: {
    [index: string]: {
      model: ModelTypes;
      ctx: number[];
      chatHistory: {
        created_at: Date;
        txt: { content: string; type: 'text' | 'code' }[];
        who: 'ollama' | 'me';
        name?: string;
      }[];
    };
  };
  current_conversation: string;
  model: ModelTypes;
  localAPI: string;
  installed_models: {
    digest: string;
    modified_at: string;
    name: string;
    size: number;
  }[];
  visited: boolean;
};
