import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon } from 'lucide-react';
import { OllamaResult, convertTextToJson, core, ollamaGenerate } from '@/core';
import { useSimple } from 'simple-core-state';
import { toast } from '@/components/ui/use-toast';

const drafts = new Map<string, string>();

export default memo(function InputPrompt() {
	const promptRef = useRef<HTMLTextAreaElement>(null);
	const connected = useSimple(core.serverConnected);
	const conversations = useSimple(core.conversations);
	const currentConversation = useSimple(core.currentConversation);
	const [txt, setTxt] = useState(() => drafts.get(currentConversation) ?? '');
	const model = useSimple(core.model);
	const generating = useSimple(core.generating);
	const disabled = !connected || generating;

	useLayoutEffect(() => {
		drafts.set(currentConversation, txt);
	}, [txt]);

	useEffect(() => {
		setTxt(drafts.get(currentConversation) ?? '');
	}, [currentConversation]);

	async function submitPrompt() {
		const startTime = Date.now();
		try {
			if (txt === '') {
				return;
			}

			setTxt('');

			core.generating.set(true);

			// Push my question to the history
			const history = conversations[currentConversation].chatHistory;
			history.push({
				created_at: new Date(),
				txt: [{ content: txt, type: 'text' }],
				who: 'me',
			});

			core.conversations.updatePiece(currentConversation, {
				...conversations[currentConversation],
				chatHistory: history,
			});

			// request the prompt
			const res = await ollamaGenerate(
				txt,
				model,
				conversations[currentConversation].ctx,
			);

			// We neet to convert the NDJSOn to json format
			const convertedToJson: OllamaResult[] = convertTextToJson(res);

			// we need to convert our data set into one string
			const txtMsg = convertedToJson.map((item) => item.response).join('');

			const currentHistory = [
				...conversations[currentConversation].chatHistory,
			];

			currentHistory.push({
				txt: [{ content: txtMsg, type: 'text' }],
				who: 'ollama',
				created_at: new Date(),
			});

			core.conversations.updatePiece(currentConversation, {
				model: model,
				chatHistory: currentHistory,
				ctx: convertedToJson[convertedToJson.length - 1].context,
			});
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Failed',
				description:
					'Something went wrong sending the promt, Check Info & Help',
			});
		} finally {
			core.generating.set(false);
		}

		// After its done, we need to auto focus since we disable the input whole its processing the request.
		if (promptRef?.current !== null) {
			setTimeout(() => {
				promptRef.current?.focus();
			}, 0);
		}

		const endTime = Date.now();

		core.lastResponseTime.set(endTime - startTime);
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
					const value = e.currentTarget.value;
					setTxt(value);
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
				disabled={txt === '' || !disabled}
				onClick={() => submitPrompt()}
				className="flex-shrink-0 ml-2 h-full w-20"
			>
				{generating ? (
					<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<SendIcon className="h-4 w-4" />
				)}
			</Button>
		</div>
	);
});
