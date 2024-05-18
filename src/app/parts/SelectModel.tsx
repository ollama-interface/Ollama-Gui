import { Select, SelectTrigger } from '@/components/ui/select';
import { useLayoutEffect, useState } from 'react';
import { ConfirmSwitchModel } from './ConfirmSwitchModel';
import { useAtomValue } from 'jotai';
import { state } from '../state';
import { updateConversation } from '../state/conversation';
import { SelectModelsContent } from './select-default-model';
import { useEvent } from '@/hooks/use-event';

export function SelectModel() {
	const currentModel = useAtomValue(state.conversation.current.model);
	const [model, setModel] = useState(currentModel);
	const currentId = useAtomValue(state.conversation.current.id);

	const [showWarning, setShowWarning] = useState(false);

	useLayoutEffect(() => {
		setModel(currentModel);
	}, [currentModel]);

	function handleConfirm(switchModel: boolean, resetChat?: boolean) {
		if (!currentId || !model) {
			return;
		}
		if (switchModel) {
			if (resetChat) {
				updateConversation(currentId, (chat) => ({
					...chat,
					model,
					chatHistory: [],
					ctx: [],
				}));
			} else {
				updateConversation(currentId, (chat) => ({ ...chat, model }));
			}
		} else {
			setModel(currentModel);
		}

		setShowWarning(false);
	}

	const handleChange = useEvent((newModel: string) => {
		if (currentId) {
			setShowWarning(true);
		}
		setModel(newModel);
	});

	return (
		<div className="mx-2 text-neutral-900 dark:text-neutral-100">
			{showWarning && <ConfirmSwitchModel onClose={handleConfirm} />}
			<Select value={model} onValueChange={handleChange}>
				<SelectTrigger className="w-full whitespace-nowrap ">
					{model ?? 'Select a Model'}
				</SelectTrigger>
				<SelectModelsContent />
			</Select>
		</div>
	);
}
