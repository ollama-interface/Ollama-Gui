export interface ConversationMeta {
  id: string;
  created_at: Date;
  model: string;
  title: string;
  is_new?: boolean;
}

export type IConversations = ConversationMeta[];
export type ConversationMessages = ConversationMessage[];

export type ToolParameter = {
  type: "string" | "number" | "integer" | "boolean" | "object" | "array";
  description: string;
  enum?: string[];
};

export type ToolFunction = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    required: string[];
    properties: Record<string, ToolParameter>;
  };
};

export type Tool = {
  type: "function";
  function: ToolFunction;
};

export type ToolCall = {
  type: "function";
  function: {
    index?: number;
    name: string;
    arguments: Record<string, any>;
  };
};

export type ToolResult = {
  tool_name: string;
  content: string;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  created_at: string;
  ai_replied: boolean;
  message: string;
  ctx?: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
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

export type ModelfileParameter = {
  name: string;
  value: string | number;
};

export type ModelfileMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type Modelfile = {
  from: string;
  parameters?: ModelfileParameter[];
  template?: string;
  system?: string;
  adapter?: string;
  license?: string;
  messages?: ModelfileMessage[];
  requires?: string;
};

export type ModelBuildRequest = {
  name: string;
  modelfile: Modelfile;
  stream?: boolean;
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
