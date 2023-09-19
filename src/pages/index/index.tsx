import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
	OllamaReturnObj,
	convertTextToJson,
	core,
	ollamaRequest,
} from "@/core";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from "@radix-ui/react-select";
import dayjs from "dayjs";
import { useCallback, useRef, useState } from "react";
import { useSimple } from "simple-core-state";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { SideInfoSheet } from "./parts/Side";

function extractTextAndCodeBlocks(
	inputString: string
): { content: string; type: "text" | "code" }[] {
	const codeBlockRegex = /```([\s\S]*?)```/g;
	const matches = [];
	let currentIndex = 0;

	inputString.replace(codeBlockRegex, (match, codeBlock, index) => {
		// Add the text before the code block to the array
		if (index > currentIndex) {
			const textBeforeCodeBlock = inputString
				.substring(currentIndex, index)
				.trim();
			if (textBeforeCodeBlock.length > 0) {
				matches.push({ content: textBeforeCodeBlock, type: "text" });
			}
		}

		// Add the code block to the array
		matches.push({ content: codeBlock, type: "code", who: "ollama" });

		// Update the current index
		currentIndex = index + match.length;
		return match;
	});

	// Add any remaining text after the last code block
	if (currentIndex < inputString.length) {
		const textAfterLastCodeBlock = inputString.substring(currentIndex).trim();
		if (textAfterLastCodeBlock.length > 0) {
			matches.push({ content: textAfterLastCodeBlock, type: "text" });
		}
	}

	return matches as any;
}

const models = [
	{
		name: "llama2",
	},
	{
		name: "llama2:13b",
	},
	{
		name: "llama2:70b",
	},
	{
		name: "llama2-uncensored",
	},
	{
		name: "codellama",
	},
	{
		name: "orca-mini",
	},
	{
		name: "vicuna",
	},
	{
		name: "nous-hermes",
	},
	{
		name: "nous-hermes:13b",
	},
	{
		name: "wizard-vicuna",
	},
];

function App() {
	const { toast } = useToast();
	const chatRef = useRef<HTMLDivElement>(null);
	const [history, setHistory] = useState<
		{
			who: "me" | "ollama";
			txt: { content: string; type: "text" | "code" }[];
			created_at: Date;
		}[]
	>([]);

	const [loading, setLoading] = useState(false);
	const [txt, setTxt] = useState("");
	const [ctx, setCtx] = useState<number[]>();
	const model = useSimple(core.model);

	const submitPrompt = useCallback(async () => {
		try {
			setLoading(true);

			// Push my question to the history
			const ch = history;
			ch.push({
				created_at: new Date(),
				txt: [{ content: txt, type: "text" }],
				who: "me",
			});
			setHistory(ch);
			setTxt("");

			// Request promopt
			const res = await ollamaRequest(txt, model, ctx);
			const convertedToJson: OllamaReturnObj[] = convertTextToJson(res);

			const txtMsg = convertedToJson.map((item) => item.response).join("");
			const currentHistory = history;

			if (txtMsg.includes("```")) {
				const codeBlocks = extractTextAndCodeBlocks(txtMsg);
				console.log(codeBlocks);
				currentHistory.push({
					created_at: new Date(),
					txt: codeBlocks,
					who: "ollama",
				});
				// setHistory();
			} else {
				currentHistory.push({
					txt: [{ content: txtMsg, type: "text" }],
					who: "ollama",
					created_at: new Date(),
				});
			}

			if (!!convertedToJson[convertedToJson.length - 1].context?.length) {
				setCtx(convertedToJson[convertedToJson.length - 1].context);
			}
			if (chatRef.current) {
				chatRef.current.scrollTo(0, chatRef.current.scrollHeight * 2);
			}

			setLoading(false);
			setHistory(currentHistory);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Failed",
				description:
					"Something went wrong sending the promt, Check Info & Help",
			});
			setLoading(false);
		}
	}, [txt, history, ctx, chatRef, model]);

	return (
		<div className=" h-full w-full flex flex-col justify-center items-center">
			<div className="flex flex-row mb-2 w-[100%] p-4">
				<Input
					autoFocus
					value={txt}
					disabled={loading}
					placeholder="Prompt"
					className="mr-2 "
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							submitPrompt();
						}
					}}
					onChange={(e) => setTxt(e.currentTarget.value)}
				/>
				<Button
					disabled={loading}
					onClick={() => submitPrompt()}
					className="flex-shrink-0"
				>
					Submit
				</Button>

				<div className="mx-2 ">
					<Select
						value={model}
						onValueChange={(e) => {
							core.model.set(e);
						}}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select a Model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Models</SelectLabel>
								{models.map((item, index) => (
									<SelectItem key={index} value={item.name}>
										{item.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<SideInfoSheet />
			</div>
			<div className="h-full w-full flex flex-row overflow-hidden">
				<div ref={chatRef} className="w-full overflow-y-scroll px-4">
					{history?.map((item, index) => (
						<div
							key={index}
							className={`relative w-full flex ${
								item.who === "ollama" ? "justify-end" : ""
							}`}
						>
							{item.who === "me" && (
								<p className="mr-2 mt-2.5 text-neutral-400">You</p>
							)}
							<div
								className={`right-0 flex flex-col mb-10 bg-neutral-50 border-solid border-neutral-200 border rounded-xl p-2 w-[80%] ${
									item.who === "ollama" ? "" : ""
								}`}
							>
								{item.txt?.map((txtItem, txtIndex) => {
									if (txtItem.type === "text") {
										return (
											<p key={txtIndex} className="text-left">
												{txtItem.content}
											</p>
										);
									} else if (txtItem.type === "code") {
										return (
											<CodeEditor
												key={txtIndex}
												className="bg-neutral-800 rounded-md my-2"
												language="javascript"
												value={txtItem.content}
												data-color-mode="dark"
												style={{
													fontSize: 12,
													fontFamily:
														"ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
												}}
											/>
										);
									}
								})}

								<p className="absolute bottom-[20px] text-xs text-neutral-500">
									{dayjs(item.created_at).format("HH:MM:ss")}
								</p>
							</div>
							{item.who === "ollama" && (
								<p className="ml-2 mt-2.5 text-neutral-400">Ollama</p>
							)}
						</div>
					))}
					{loading && (
						<Skeleton className="w-full h-[20px] rounded-full mt-2" />
					)}
					{history?.length === 0 && !loading && (
						<p className="text-neutral-600">No message</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
