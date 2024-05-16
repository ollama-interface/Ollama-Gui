export type ModelTypes =
	| 'llama3'
	| 'llama2'
	| 'llama2:13b'
	| 'llama2:70b'
	| 'llama2:uncensored'
	| 'codellama'
	| 'orca-mini';

export interface Conversation {
	id: string;
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

export type Conversations = { [index: string]: Conversation };

export type IModelType = {
	digest: string;
	modified_at: string;
	name: string;
	size: number;
};

export type CoreStore = {
	conversations: {
		[index: string]: Conversation;
	};
	currentConversation: string;
	model: ModelTypes;
	localAPI: string;
	serverConnected: boolean;
	installedModels: IModelType[];
	visited: boolean;
	lastResponseTime: number | undefined;
};
