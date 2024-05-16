import { Button } from '@/components/ui/button';
import { core, createNewConversation } from '@/core';
import { memo, useState } from 'react';
import { useSimple } from 'simple-core-state';

export default memo(function Sidebar() {
	const [currentEdit, setCurrentEdit] = useState('');
	const conversations = useSimple(core.conversations);
	const currentConversation = useSimple(core.currentConversation);
	const loading = useSimple(core.generating);

	const newConversation = () => {
		const id = createNewConversation();
		core.currentConversation.set(id);
		setCurrentEdit(id);
	};

	return (
		<div className="flex flex-col shrink-0 p-4 pt-3 w-[280px] bg-neutral-50 dark:bg-stone-950">
			<Button
				disabled={loading}
				className="w-full dark:text-white"
				variant="outline"
				onClick={newConversation}
			>
				Create new conversation
			</Button>
			<div className="mt-2 overflow-y-auto h-[calc(100%-30px)]">
				<div>
					{Object.entries(conversations).map(([id, conversation], index) => {
						const name = conversation.name ?? id;
						return (
							<div
								className={`${
									currentConversation === id
										? 'bg-neutral-200 dark:bg-neutral-800'
										: 'bg-neutral-100 dark:bg-neutral-900'
								} p-2 hover:bg-neutral-200 mb-2 rounded-md select-none cursor-pointer text-black dark:text-white`}
								onClick={() => {
									core.currentConversation.set(id);
								}}
								onDoubleClick={() => {
									setCurrentEdit(id);
								}}
								key={index}
							>
								{currentEdit !== id ? (
									<p>{name}</p>
								) : (
									<RenameInput
										initialName={name}
										onFinish={(newName) => {
											core.conversations.patchObject({
												[id]: {
													...conversation,
													name: newName.length > 0 ? newName : id,
												},
											});
											setCurrentEdit('');
										}}
									/>
								)}
							</div>
						);
					})}
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
