import { memo, useEffect, useRef } from 'react';
import { ConversationBlock } from './parts/ConversationBlock';
import { useSimple } from 'simple-core-state';
import { convertTextToJson, core, ollamaGenerate } from '@/core';
import { Skeleton } from '@/components/ui/skeleton';
import dayjs from 'dayjs';
import { Conversation } from '@/core/types';

const states: Record<string, { state: 'loading' }> = {};

async function updateName(id: string, conversation: Conversation) {
	const res = await ollamaGenerate(
		"Please give name for the dialogue. Don't use markdown. Without prefix.",
		conversation.model,
		conversation.ctx,
	);

	const convertedToJson = convertTextToJson(res);
	const txtMsg = convertedToJson.map((item) => item.response).join('');
	core.conversations.patchObject({
		[id]: {
			...conversation,
			name: txtMsg,
		},
	});
}

export default memo(function Chat() {
	const chatRef = useRef<HTMLDivElement>(null);
	const conversations = useSimple(core.conversations);
	const currentConversationId = useSimple(core.currentConversation);
	const generating = useSimple(core.generating);
	const currentConversation = conversations[currentConversationId];

	useEffect(() => {
		chatRef.current?.scrollTo({
			top: chatRef.current.scrollHeight,
		});
	}, [conversations, currentConversationId]);

	useEffect(() => {
		if (
			currentConversation?.name === undefined &&
			states[currentConversationId]?.state !== 'loading' &&
			currentConversation.chatHistory.length > 0
		) {
			states[currentConversationId] = { state: 'loading' };
			updateName(currentConversationId, currentConversation).finally(() => {
				delete states[currentConversationId];
			});
		}
	}, [currentConversationId, currentConversation.chatHistory.length]);

	return (
		<div
			ref={chatRef}
			className="h-full w-full overflow-hidden overflow-y-scroll"
		>
			<div className="flex flex-col min-h-full justify-end w-full px-4">
				{currentConversation?.chatHistory.length > 0 ? (
					<ConversationBlock conversation={currentConversation} />
				) : (
					<p className="text-neutral-400 dark:text-neutral-600 text-center mt-10">
						No message
					</p>
				)}
				{generating && (
					<div className={`relative w-full flex justify-end`}>
						<div
							className={`right-0 flex flex-col mb-10 bg-zinc-100 dark:bg-zinc-900 border-solid border-neutral-200 dark:border-neutral-800 border rounded-xl p-2 w-[80%]`}
						>
							<Skeleton className="w-full h-10 animate-pulse" />

							<p className="absolute bottom-[20px] text-xs text-neutral-500">
								{dayjs(Date.now()).format('HH:MM:ss')}
							</p>
						</div>
						<p className="ml-2 mt-2.5 text-neutral-400">Ollama</p>
					</div>
				)}
			</div>
		</div>
	);
});
