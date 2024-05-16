import { atom } from 'jotai';
import Immutable from 'immutable';
import { atomPersist, atomWithAsyncStorage, db } from './persist';
import { store } from './store';

export interface Conversation {
	id: string;
	model: string;
	ctx: number[];
	chatHistory: {
		created_at: Date;
		txt: { content: string; type: 'text' }[];
		who: 'ollama' | 'me';
		name?: string;
	}[];
	name?: string;
}

export async function loadConversationsFromDB(): Promise<
	Immutable.Map<string, Conversation>
> {
	const storedConversations = await db.load('conversations');
	try {
		return Immutable.Map(JSON.parse(storedConversations ?? '[]'));
	} catch (error) {
		console.error(error);
		return Immutable.Map();
	}
}

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
