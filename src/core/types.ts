export type ModelTypes =
  | "llama2"
  | "llama2:13b"
  | "llama2:70b"
  | "llama2:uncensored"
  | "codellama"
  | "orca-mini";

export interface IConversationType {
  id: string;
  created_at: Date;
  model: string;
  title: string;
}

export type IConversations = IConversationType[];
export type ConversationMessages = ConversationMessage[];

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  created_at: string;
  ai_replied: boolean;
  message: string;
  ctx?: string;
};

export type IModelType = {
  digest: string;
  modified_at: string;
  name: string;
  size: number;
};

export type ICoreType = {
  database: {
    ready: boolean;
  };
  conversations: IConversations;
  focused_conv_id: string;
  focused_conv_data: ConversationMessages;
  focused_conv_meta: IConversationType;

  model: ModelTypes;
  localAPI: string;
  server_connected: boolean;
  installed_models: IModelType[];
  visited: boolean;
};
