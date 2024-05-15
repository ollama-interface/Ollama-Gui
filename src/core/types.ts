export type ModelTypes =
	| 'llama2'
	| 'llama2:13b'
	| 'llama2:70b'
	| 'llama2:uncensored'
	| 'codellama'
	| 'orca-mini';

export interface IConversationType {
	model: ModelTypes;
	ctx: number[];
	chatHistory: {
		created_at: Date;
		txt: { content: string; type: 'text' }[];
		who: 'ollama' | 'me';
		name?: string;
	}[];
	name?: string;
}

export type IConversations = { [index: string]: IConversationType };

export type IModelType = {
	digest: string;
	modified_at: string;
	name: string;
	size: number;
};

export type ICoreType = {
	conversations: {
		[index: string]: IConversationType;
	};
	current_conversation: string;
	model: ModelTypes;
	localAPI: string;
	server_connected: boolean;
	installed_models: IModelType[];
	visited: boolean;
};
