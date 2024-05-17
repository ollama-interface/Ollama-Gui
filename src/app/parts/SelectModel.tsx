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
import React, { useCallback, useState } from 'react';
import { useSimple } from 'simple-core-state';
import { ConfirmSwitchModel } from './ConfirmSwitchModel';
import { ModelTypes } from '@/core/types';
import { useAtom } from 'jotai';
import { state } from '../state';

interface ISelectConversationProps {
	loading: boolean;
}

export const SelectModel: React.FC<ISelectConversationProps> = ({
	loading,
}) => {
	const [model, setModel] = useAtom(state.app.model);
	const installedModels = useSimple(core.installedModels);
	const currentConv = useSimple(core.currentConversation);
	const conversations = useSimple(core.conversations);

	const [showWarning, setShowWarning] = useState(false);

	const handleConfirm = useCallback(
		(switchModel: boolean, resetChat?: boolean) => {
			if (switchModel) {
				if (resetChat) {
					// core.conversations.patchObject({
					// 	[currentConv]: { chatHistory: [], ctx: [], model: model },
					// });
				} else {
					// core.conversations.patchObject({
					// 	[currentConv]: { ...conversations[currentConv], model: model },
					// });
				}
			} else {
				core.model.revert();
			}

			setShowWarning(false);
		},
		[model, currentConv, currentConv],
	);

	return (
		<div className="mx-2">
			{showWarning && <ConfirmSwitchModel onClose={handleConfirm} />}
			<Select
				disabled={loading}
				value={model}
				onValueChange={(newModel) => {
					setShowWarning(true);
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
