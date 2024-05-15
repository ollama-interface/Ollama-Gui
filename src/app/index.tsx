import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { core, ollamaGenerate, OllamaResult, convertTextToJson } from '@/core';
import { updateModelsAvailability, isRunningUpdate } from '@/app/helper';
import { ConversationBlock } from '@/app/parts/ConversationBlock';
import { IntroCard } from '@/app/parts/IntroCard';
import Sidebar from '@/app/parts/Sidebar';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useSimple } from 'simple-core-state';
import { useRunningPoll } from '@/hooks';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon } from 'lucide-react';
import Header from './header';

function HomePage() {
	useRunningPoll();

	const { toast } = useToast();
	const chatRef = useRef<HTMLDivElement>(null);
	const promptRef = useRef<HTMLTextAreaElement>(null);

	const model = useSimple(core.model);
	const visited = useSimple(core.visited);
	const ollamaConnected = useSimple(core.serverConnected);
	const conversations = useSimple(core.conversations);
	const currentConversation = useSimple(core.currentConversation);

	const [showIntroCard, setShowIntroCard] = useState(false);
	const [txt, setTxt] = useState('');
	const [isShifted, setIsShifted] = useState(false);

	const submitPrompt = useCallback(async () => {
		const startTime = Date.now();
		try {
			if (txt === '') {
				return;
			}
			core.generating.set(true);

			// Push my question to the history
			const ch = conversations[currentConversation].chatHistory;
			ch.push({
				created_at: new Date(),
				txt: [{ content: txt, type: 'text' }],
				who: 'me',
			});

			core.conversations.updatePiece(currentConversation, {
				...conversations[currentConversation],
				chatHistory: ch,
			});

			setTxt('');

			// request the prompt
			const res = await ollamaGenerate(
				txt,
				model,
				conversations[currentConversation].ctx
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

			if (chatRef.current) {
				chatRef.current.scrollTo(0, chatRef.current.scrollHeight * 2);
			}

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
	}, [txt, chatRef, promptRef, model, conversations, currentConversation]);

	useEffect(() => {
		if (visited === false) {
			setShowIntroCard(true);
		}
	}, [visited]);

	return (
		<div className="flex flex-row h-full">
			<Sidebar />
			<div className="dark:bg-black h-full w-full flex flex-col justify-center items-center">
				{showIntroCard && (
					<IntroCard
						onClose={(e) => {
							if (e) core.visited.set(true);
							setShowIntroCard(false);
						}}
					/>
				)}

				<Header />

				<div className="h-full w-full flex flex-row overflow-hidden">
					<div ref={chatRef} className="w-full overflow-y-scroll px-4">
						<ConversationBlock
							conversations={conversations}
							currentConversation={currentConversation}
						/>
						{/* {loading && (
							<Skeleton className="w-full h-[20px] rounded-full mt-2" />
						)} */}
					</div>
				</div>
				<div className="flex flex-col w-full pb-[5px] mt-2">
					<div className="flex flex-row w-full p-4 ">
						<Textarea
							ref={promptRef}
							autoFocus
							rows={4}
							disabled={!ollamaConnected}
							placeholder="Your message..."
							value={txt}
							onChange={(e) => setTxt(e.currentTarget.value)}
							className="dark:bg-black dark:text-zinc-300 p-1 px-2 max-h-[300px] flex-grow flex border dark:border-neutral-800"
							onKeyUp={(e) => {
								if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
									setIsShifted(false);
								}
							}}
							onKeyDown={(e) => {
								if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
									setIsShifted(true);
								}

								if (e.key === 'Enter' && !isShifted) {
									submitPrompt();
								}
							}}
						/>

						<Button
							variant="secondary"
							disabled={txt === '' || !ollamaConnected}
							onClick={() => submitPrompt()}
							className="flex-shrink-0 ml-2 h-full w-20"
						>
							{false ? (
								<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<SendIcon className="mr-2 h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default HomePage;
