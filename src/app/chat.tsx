import { memo, useEffect, useRef } from 'react';
import { P, match } from 'ts-pattern';
import { ConversationBlock } from './parts/ConversationBlock';
import { useSimple } from 'simple-core-state';
import { convertTextToJson, core, ollamaGenerate } from '@/core';
import { Skeleton } from '@/components/ui/skeleton';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { state } from './state';
import { Conversation } from './state/conversation';

const states: Record<string, { state: 'loading' }> = {};

async function requestName(conversation: Conversation) {
	const res = await ollamaGenerate(
		"Please give name for the dialogue. Don't use markdown. Without prefix.",
		conversation.model,
		conversation.ctx,
	);

	const convertedToJson = convertTextToJson(res);
	const txtMsg = convertedToJson.map((item) => item.response).join('');
	return { ...conversation, name: txtMsg };
}

export default memo(function Chat() {
	const chatRef = useRef<HTMLDivElement>(null);
	const currentConversationId = useSimple(core.currentConversation);
	const generating = useAtomValue(state.app.generating);
	const setConversations = useSetAtom(state.conversation.record);
	const currentConversation = useAtomValue(state.conversation.current.chat);

	useEffect(() => {
		chatRef.current?.scrollTo({
			top: chatRef.current.scrollHeight,
		});
	}, [currentConversationId]);

	useEffect(() => {
		if (
			currentConversation.status === 'loading' ||
			!currentConversation.value
		) {
			return;
		}
		const current = currentConversation.value;
		if (
			current.name === undefined &&
			states[currentConversationId]?.state !== 'loading' &&
			current.chatHistory.length > 0
		) {
			states[currentConversationId] = { state: 'loading' };
			requestName(current)
				.then((updated) => {
					setConversations((prev) => {
						return prev.set(currentConversationId, updated);
					});
				})
				.finally(() => {
					delete states[currentConversationId];
				});
		}
	}, [currentConversationId, currentConversation]);

	return (
		<div
			ref={chatRef}
			className="h-full w-full overflow-hidden overflow-y-scroll"
		>
			<div className="flex flex-col min-h-full justify-end w-full px-4">
				{match(currentConversation)
					.with(
						{
							status: 'loaded',
							value: P.when((v) => (v?.chatHistory.length ?? 0) > 0),
						},
						({ value }) => {
							return <ConversationBlock conversation={value!} />;
						},
					)
					.otherwise(() => (
						<p className="text-neutral-400 dark:text-neutral-600 text-center mt-10">
							No message
						</p>
					))}
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