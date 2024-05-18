import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { OLLAMA_COMMAND } from '@/core';
import { tryConnect } from '../helper';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { memo, useRef, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { state } from '../state';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { SelectDefaultModel } from './select-default-model';

const LocalAPIInput = memo(function LocalAPIInput({
	loading,
}: {
	loading: boolean;
}) {
	const [url, setUrl] = useAtom(state.app.localAPI);
	return (
		<Input
			disabled={loading}
			type="text"
			className="dark:text-white"
			placeholder="Ollama url"
			value={url}
			onChange={(e) => setUrl(e.currentTarget.value)}
		/>
	);
});

const Connection = memo(function Connection({ loading }: { loading: boolean }) {
	const connected = useAtomValue(state.app.connected);
	return (
		<>
			<LocalAPIInput loading={loading} />
			<div className="mb-4 mt-2 fkex">
				<Button size="sm" onClick={tryConnect}>
					Connect
				</Button>
				{connected && (
					<Badge
						className="ml-2 bg-green-200 hover:bg-green-200 text-green-700"
						variant="secondary"
					>
						Connected
					</Badge>
				)}
			</div>
		</>
	);
});

export interface Props {
	loading: boolean;
}

export function SideInfoSheet({ loading }: Props) {
	const sheetRef = useRef<HTMLButtonElement>(null);
	const { toast } = useToast();

	const setConversations = useSetAtom(state.conversation.record);

	function resetConversations() {
		setConversations((r) => r.clear());
		toast({
			title: 'Conversation has been cleared',
			description:
				'All conversations has been cleared and you can start from fresh.',
		});

		sheetRef.current?.click();
	}

	const [showResetConfirm, setShowResetConfirm] = useState(false);
	function handleResetResponse(confirmed: boolean) {
		if (confirmed) {
			resetConversations();
		}
		setShowResetConfirm(false);
	}

	return (
		<Sheet>
			{showResetConfirm && <ConfirmModal onResponse={handleResetResponse} />}
			<SheetTrigger asChild ref={sheetRef}>
				<Button variant="outline" className="whitespace-nowrap dark:text-white">
					Settings & Info
				</Button>
			</SheetTrigger>
			<SheetContent className="border-neutral-100 dark:border-neutral-900 overflow-auto text-neutral-900 dark:text-neutral-100">
				<div className="flex flex-col h-full">
					<SheetHeader>
						<SheetTitle>Welcome to Ollama Web Interface</SheetTitle>
						<SheetDescription>
							Thank you for visiting this website, I made this because there is
							no web chat interface I have found at the time building this.
						</SheetDescription>
					</SheetHeader>

					<div className="flex flex-col flex-1 justify-between">
						<div>
							<Label className="mb-1 font-medium mr-1">Ollama:</Label>
							<a
								href="https://ollama.ai/"
								className="text-sm  underline underline-offset-4 "
							>
								https://ollama.ai/
							</a>
							<div className="flex flex-col mt-4">
								<Connection loading={loading} />
								<Label className="mt-6 mb-1 font-medium ">
									Serve command for ollama:
								</Label>
								<code className="relative rounded bg-neutral-200  dark:bg-neutral-800 px-[0.5rem] py-[0.5rem] font-mono text-sm font-semibold pb-8">
									<p className="break-words">{OLLAMA_COMMAND}</p>
									<Button
										size="sm"
										className="absolute bottom-0 right-0"
										variant="link"
										onClick={() => {
											navigator.clipboard.writeText(OLLAMA_COMMAND).then(() => {
												toast({
													title: 'Command copied',
													description: 'Command has been copied to clipboard.',
												});
											});
										}}
									>
										Copy
									</Button>
								</code>
							</div>
							<div className="mt-2 w-full flex items-center">
								<Label className="shrink-0 pr-2">Default Model:</Label>
								<SelectDefaultModel />
							</div>
						</div>
						<div className="flex flex-col justify-self-end">
							<Button
								onClick={() => setShowResetConfirm(true)}
								variant="destructive"
								className="mt-6 w-fit"
							>
								Reset Conversations
							</Button>
							<a
								href="https://github.com/snatvb/Ollama-Gui"
								target="_blank"
								className="mt-2 flex items-center gap-2 text-sm underline hover:opacity-60 dark:text-white"
							>
								<GitHubLogoIcon className="h-6 w-6" />
								https://github.com/snatvb/Ollama-Gui
							</a>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
