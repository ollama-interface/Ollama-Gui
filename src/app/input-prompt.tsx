import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon } from 'lucide-react';
import { convertTextToJson, core, ollamaGenerate } from '@/core';
import { useSimple } from 'simple-core-state';
import { toast } from '@/components/ui/use-toast';
import { state } from './state';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

const drafts = new Map<string, string>();

export default memo(function InputPrompt() {
	const promptRef = useRef<HTMLTextAreaElement>(null);
	const connected = useSimple(core.serverConnected);
	const conversations = useSimple(core.conversations);
	const setLastResponseTime = useSetAtom(state.app.lastResponseTime);
	const [currentChat, updateCurrentChat] = useAtom(
		state.conversation.current.chat,
	);
	const currentConversationId = useAtomValue(state.conversation.current.id);
	const [txt, setTxt] = useState(
		() => drafts.get(currentConversationId ?? '') ?? '',
	);
	const model = useSimple(core.model);
	const [generating, setGenerating] = useAtom(state.app.generating);
	const disabled =
		!connected ||
		(generating === currentConversationId && generating !== undefined);

	useLayoutEffect(() => {
		if (currentConversationId) {
			drafts.set(currentConversationId, txt);
		}
	}, [txt]);

	useEffect(() => {
		if (currentConversationId === undefined) {
			return;
		}
		setTxt(drafts.get(currentConversationId) ?? '');
		promptRef.current?.focus();
	}, [currentConversationId]);

	async function submitPrompt() {
		const startTime = Date.now();
		try {
			if (txt === '' || currentChat.status !== 'loaded') {
				return;
			}
			const chat = currentChat.value;
			if (!chat) {
				return;
			}

			setTxt('');
			setGenerating(chat.id);

			const history = conversations[chat.id].chatHistory;
			history.push({
				created_at: new Date(),
				txt: [{ content: txt, type: 'text' }],
				who: 'me',
			});

			updateCurrentChat({
				...chat,
				chatHistory: history,
			});
			const res = await ollamaGenerate(txt, model, chat.ctx);
			const convertedToJson = convertTextToJson(res);
			const txtMsg = convertedToJson.map((item) => item.response).join('');

			const currentHistory = [...chat.chatHistory];

			currentHistory.push({
				txt: [{ content: txtMsg, type: 'text' }],
				who: 'ollama',
				created_at: new Date(),
			});
			const updatedCtx = convertedToJson[convertedToJson.length - 1].context;
			if (!updatedCtx) {
				throw new Error('No context found');
			}
			updateCurrentChat({
				...chat,
				chatHistory: currentHistory,
				ctx: updatedCtx,
			});
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Failed',
				description:
					'Something went wrong sending the promt, Check Info & Help',
			});
		} finally {
			setGenerating(undefined);
		}

		// After its done, we need to auto focus since we disable the input whole its processing the request.
		setTimeout(() => {
			if (promptRef?.current) {
				promptRef.current.focus();
			}
		}, 0);

		const endTime = Date.now();

		setLastResponseTime(endTime - startTime);
	}

	return (
		<div className="flex flex-row w-full p-4 ">
			<Textarea
				ref={promptRef}
				autoFocus
				rows={4}
				disabled={!connected}
				placeholder="Your message..."
				value={txt}
				onChange={(e) => {
					setTxt(e.currentTarget.value);
				}}
				className="dark:bg-black dark:text-zinc-300 p-1 px-2 max-h-[300px] flex-grow flex border dark:border-neutral-800"
				onKeyDown={(e) => {
					if (e.key === 'Enter' && e.ctrlKey) {
						submitPrompt();
					}
				}}
			/>

			<Button
				variant="secondary"
				disabled={txt === '' || disabled}
				onClick={() => submitPrompt()}
				className="flex-shrink-0 ml-2 h-full w-20"
			>
				{generating ? (
					<ReloadIcon className="h-4 w-4 animate-spin" />
				) : (
					<SendIcon className="h-4 w-4" />
				)}
			</Button>
		</div>
	);
});
