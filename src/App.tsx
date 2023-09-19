import { useCallback, useRef, useState } from "react";

import "./App.css";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
	OllamaReturnObj,
	convertTextToJson,
	core,
	ollamaRequest,
} from "./core";
import { Skeleton } from "./components/ui/skeleton";
import dayjs from "dayjs";

import CodeEditor from "@uiw/react-textarea-code-editor";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./components/ui/select";
import { useSimple } from "simple-core-state";
import {
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	Sheet,
	SheetFooter,
} from "./components/ui/sheet";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";

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
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline" className="whitespace-nowrap">
							Info & Help
						</Button>
					</SheetTrigger>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>Welcome to Ollama Chat Box</SheetTitle>
							<SheetDescription>
								Thank you for visiting this website, I made this because there
								is no web chat interface I have found at the time building this.
							</SheetDescription>
							<div className="">
								<a className="mr-1 text-sm font-bold text-neutral-800">
									Download link:
								</a>
								<a
									href="https://ollama.ai/"
									className="text-sm  underline underline-offset-4"
								>
									https://ollama.ai/
								</a>
								<div className="flex flex-col mt-4">
									<a className="mt-4 text-sm mb-2">Serve command for ollama:</a>
									<code className="relative rounded bg-neutral-200 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold pb-8">
										{`OLLAMA_ORIGINS=https://ollama-web-pvx6p8f7s-twanluttik.vercel.app ollama serve`}
									</code>
									<div className="flex justify-end mt-2">
										<Button>
											<ClipboardCopyIcon className="mr-2" />
											Copy
										</Button>
									</div>
									<a className="italic text-sm text-neutral-500 mt-6">
										We need to run this, otherwise the website can't access your
										ollama server on <strong>your</strong> machine
									</a>
								</div>
							</div>
							<SheetFooter className="pt-20 flex flex-col">
								<a
									href="https://twtter.com/twanluttik"
									className="font-medium  underline  text-sm"
								>
									Twan Luttik - X (Twitter)
								</a>
							</SheetFooter>
						</SheetHeader>
					</SheetContent>
				</Sheet>
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
