import { SimpleCore } from 'simple-core-state';
import { CoreStore } from './types';

const instance = new SimpleCore<CoreStore>(
	{
		conversations: {
			session: { chatHistory: [], ctx: [], model: 'llama3', name: 'Session' },
		},
		currentConversation: 'session',
		model: 'llama3',
		localAPI: 'http://127.0.0.1:11435',
		serverConnected: false,
		installedModels: [],
		visited: false,
		generating: false,
		lastResponseTime: undefined,
	},
	{ storage: { prefix: 'ollama_web_ui_' } }
);

instance.persist([
	'model',
	'localAPI',
	'visited',
	'conversations',
	'currentConversation',
]);

export const core = instance.core();
