import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { core } from '@/core';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import React, { useLayoutEffect, useState } from 'react';
import { useSimple } from 'simple-core-state';
import { ConfirmSwitchModel } from './ConfirmSwitchModel';
import { useAtomValue } from 'jotai';
import { state } from '../state';
import { updateConversation } from '../state/conversation';

interface ISelectConversationProps {
	loading: boolean;
}

export const SelectModel: React.FC<ISelectConversationProps> = ({
	loading,
}) => {
	const currentModel = useAtomValue(state.conversation.current.model);
	const [model, setModel] = useState(currentModel);
	const installedModels = useSimple(core.installedModels);
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

	return (
		<div className="mx-2">
			{showWarning && <ConfirmSwitchModel onClose={handleConfirm} />}
			<Select
				disabled={loading}
				value={model}
				onValueChange={(newModel) => {
					if (currentId) {
						setShowWarning(true);
					}
					setModel(newModel);
				}}
			>
				<SelectTrigger className="w-fit whitespace-nowrap dark:text-white">
					<SelectValue placeholder="Select a Model" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Models</SelectLabel>
						{installedModels.map((item, index) => (
							<SelectItem key={index} value={item.name}>
								<div className="flex flex-row items-center">
									<a>{item.name}</a>
									{!installedModels.filter((e) => e.name.includes(item.name))
										?.length && (
										<ExclamationTriangleIcon className="ml-2" color="#e94646" />
									)}
								</div>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
};
