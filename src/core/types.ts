export interface ConversationMeta {
  id: string;
  created_at: Date;
  model: string;
  title: string;
  is_new?: boolean;
}

export type IConversations = ConversationMeta[];
export type ConversationMessages = ConversationMessage[];

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  created_at: string;
  ai_replied: boolean;
  message: string;
  ctx?: string;
  metrics?: {
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  };
};

export type IModelType = {
  name: string;
  digest: string;
  modified_at: string;
  size: number;
};

export type ICoreType = {
  database: {
    ready: boolean;
  };
  conversations: IConversations;
  focused_conv_id: string;
  focused_conv_data: ConversationMessages;
  focused_conv_meta: ConversationMeta;
  last_used_model: string;

  server_host: string;
  server_connected: boolean;
  available_models: IModelType[];
  introduction_finished: boolean;
  streaming_conv_id: string;
  show_metrics: boolean;
};
