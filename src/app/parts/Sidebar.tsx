import { Button } from '@/components/ui/button';
import { core, generateRandomString } from '@/core';
import { useAtom, useAtomValue } from 'jotai';
import { memo, useState } from 'react';
import { state } from '../state';
import { match, P } from 'ts-pattern';
import { ReloadIcon } from '@radix-ui/react-icons';
import { updateConversation } from '../state/conversation';

export default memo(function Sidebar() {
	const [currentEdit, setCurrentEdit] = useState('');
	const [conversations, setConversations] = useAtom(state.conversation.record);
	const [currentId, setCurrentId] = useAtom(state.conversation.current.id);
	const model = useAtomValue(state.app.model);

	function newConversation() {
		if (conversations.status !== 'loaded') {
			return;
		}

		const id = generateRandomString(8);
		core.currentConversation.set(id);
		setConversations((c) =>
			c.set(id, {
				id,
				chatHistory: [],
				ctx: [],
				model: model ?? 'llama3',
			}),
		);
		setCurrentId(id);
	}

	return (
		<div className="flex flex-col shrink-0 p-4 pt-3 w-[280px] dark:text-white bg-neutral-50 dark:bg-stone-950">
			<Button
				className="w-full dark:text-white"
				variant="outline"
				onClick={newConversation}
			>
				Create new conversation
			</Button>
			<div className="mt-2 overflow-y-auto h-[calc(100%-30px)]">
				<div className="flex flex-col items-center">
					{match(conversations)
						.with(
							{ status: 'loaded', value: P.when((x) => x.count() > 0) },
							(result) =>
								result.value.valueSeq().map((conversation) => {
									const id = conversation.id;
									const name = conversation.name ?? id;
									return (
										<div
											className={`
											${
												currentId === id
													? 'bg-neutral-200 dark:bg-neutral-800'
													: 'bg-neutral-100 dark:bg-neutral-900'
											} flex-1 w-full p-2 hover:bg-neutral-200 mb-2 rounded-md select-none cursor-pointer text-black dark:text-white`}
											onClick={() => {
												core.currentConversation.set(id);
												setCurrentId(id);
											}}
											onDoubleClick={() => {
												setCurrentEdit(id);
											}}
											key={id}
										>
											{currentEdit !== id ? (
												<p className="truncate">{name}</p>
											) : (
												<RenameInput
													initialName={name}
													onFinish={(newName) => {
														updateConversation(id, (prev) => ({
															...prev,
															name: newName.length > 0 ? newName : undefined,
														}));
														setCurrentEdit('');
													}}
												/>
											)}
										</div>
									);
								}),
						)
						.with({ status: 'loading' }, () => (
							<ReloadIcon className="h-8 w-8 animate-spin" />
						))
						.with(
							{ status: 'loaded', value: P.when((x) => x.count() === 0) },
							() => <p>No conversations</p>,
						)
						.otherwise(() => (
							<p>Error</p>
						))}
				</div>
			</div>
		</div>
	);
});

function RenameInput({
	onFinish,
	initialName,
}: {
	initialName: string;
	onFinish: (name: string) => void;
}) {
	return (
		<input
			onKeyDown={(e) => {
				if (e.code === 'Escape' || e.code === 'Enter') {
					e.currentTarget.blur();
				}
			}}
			autoFocus
			onBlur={(e) => onFinish(e.currentTarget.value)}
			className="bg-transparent"
			defaultValue={initialName}
		/>
	);
}
