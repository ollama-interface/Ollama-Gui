import { state } from '@/app/state';
import { Conversations } from '@/app/state/conversation';
import { core } from '@/core';
import Immutable from 'immutable';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';

export function useMigration() {
	const setConversations = useSetAtom(state.conversation.record);
	const [migrated, setMigrated] = useAtom(state.conversation.migrated);

	useEffect(() => {
		if (migrated) {
			return;
		}

		const conversations: Conversations = Immutable.Map(
			Object.entries(core.conversations._value).map(([id, conversation]) => {
				if (conversation.name === undefined) {
					return [id, { ...conversation, id }];
				}
				return [id, conversation];
			}),
		);

		setConversations((prev) => prev.merge(conversations));
		setMigrated(true);
	}, []);
}
