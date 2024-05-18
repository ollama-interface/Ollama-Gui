import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import { SelectModel } from './parts/SelectModel';
import { SideInfoSheet } from './parts/SideInfoSheet';
import { ModeToggle } from '@/components/mode-toggle';
import { core } from '@/core';
import { ConfirmChatClear } from './parts/ConfirmChatClear';
import { memo, useEffect } from 'react';
import { useRequestUpdateModels } from './helper';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { state } from './state';
import { AlertDialog, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useEvent } from '@/hooks/use-event';

export default memo(function Header() {
	const connected = useAtomValue(state.app.connected);
	const generating = useAtomValue(state.app.generating);
	const [currentChatId, setCurrentChatId] = useAtom(
		state.conversation.current.id,
	);
	const lastResponseTime = useAtomValue(state.app.lastResponseTime);
	const updateConversations = useSetAtom(state.conversation.record);
	const requestUpdateModels = useRequestUpdateModels();
	const disabled = generating ? generating === currentChatId : false;

	useEffect(() => {
		if (connected) {
			requestUpdateModels();
			// try {
			// 	updateModelsAvailability();
			// } catch (error) {
			// 	toast({
			// 		variant: 'destructive',
			// 		title: 'Something went wrong',
			// 		description: String(error),
			// 	});
			// }
		} else {
			core.installedModels.reset();
		}
	}, [connected]);

	const deleteChat = useEvent(function deleteConversation() {
		if (!currentChatId) {
			return;
		}
		updateConversations((prev) => prev.delete(currentChatId));
		setCurrentChatId(undefined);
	});

	return (
		<div className="flex items-center justify-between w-full p-2">
			<div className="flex items-center">
				<div className="h-full flex items-center">
					<Badge variant={connected ? 'secondary' : 'destructive'}>
						{connected ? 'Connected' : 'Disconnected'}
					</Badge>
				</div>

				{lastResponseTime && (
					<div className="ml-2 flex flex-row">
						<p className="font-medium text-black dark:text-white">
							Time taken:
						</p>
						<p className="ml-1 text-neutral-500 ">{lastResponseTime / 1000}s</p>
					</div>
				)}
			</div>

			<div className="flex items-center">
				{currentChatId && (
					<>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									disabled={disabled || !currentChatId}
									size="default"
									className="w-10 p-0 px-2 ml-2 bg-red-400 hover:bg-red-400 dark:bg-red-500 dark:hover:bg-red-500 dark:text-white hover:opacity-60"
								>
									<TrashIcon height={21} width={21} />
								</Button>
							</AlertDialogTrigger>
							<ConfirmChatClear onAgree={deleteChat} />
						</AlertDialog>

						<SelectModel loading={disabled} />
					</>
				)}
				<SideInfoSheet loading={disabled} />

				<ModeToggle />
			</div>
		</div>
	);
});
