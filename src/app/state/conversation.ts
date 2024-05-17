import { atom } from 'jotai';
import Immutable from 'immutable';
import { atomPersist, atomWithAsyncStorage, db } from './persist';
import { store } from './store';

export type Message = {
	created_at: Date;
	txt: {
		content: string;
		type: 'text';
	}[];
	who: 'ollama' | 'me';
	name?: string;
};

export interface Conversation {
	id: string;
	model: string;
	ctx: number[];
	chatHistory: Message[];
	name?: string;
}

export type Conversations = Immutable.Map<string, Conversation>;

export async function loadConversationsFromDB(): Promise<Conversations> {
	const storedConversations = await db.load('conversations');
	try {
		return Immutable.Map(JSON.parse(storedConversations ?? '[]'));
	} catch (error) {
		console.error(error);
		return Immutable.Map();
	}
}
export const migrated = atomPersist('MIGRATED_FROM_LS', false, String, Boolean);

const currentId = atomPersist('CURRENT_CHAT_ID', undefined, String, String);
export const record = atomWithAsyncStorage(
	async () => loadConversationsFromDB(),
	async (value) => {
		await db.save('conversations', JSON.stringify(value.toJSON()));
	},
);

export const current = {
	id: currentId,
	chat: atom((get) => {
		const id = get(currentId);
		const recordResult = get(record);
		if (!id) {
			return { status: 'loaded' as const, value: undefined };
		}
		if (recordResult.status === 'loading') {
			return { status: 'loading' as const };
		}
		if (recordResult.status === 'loaded') {
			return {
				status: 'loaded' as const,
				value: recordResult.value.get(id),
			};
		}
		return { status: 'loaded' as const, value: undefined };
	}),
};

export function updateConversation(
	id: string,
	onUpdateItem: (item: Conversation) => Conversation,
) {
	store.set(record, (rec) => {
		const item = rec.get(id);
		if (!item) {
			return rec;
		}

		return rec.set(id, onUpdateItem(item));
	});
}

export function appendHistoryConversation(id: string, msg: Message) {
	store.set(record, (rec) => {
		const item = rec.get(id);
		if (!item) {
			console.error(`No conversation found ${id}`);
			return rec;
		}

		return rec.set(id, {
			...item,
			chatHistory: [...item.chatHistory, msg],
		});
	});
}
