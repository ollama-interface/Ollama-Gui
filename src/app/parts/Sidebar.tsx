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
					{Object.entries(conversations).map((item, index) => {
						return (
							<div
								className={`${
									currentConversation === item[0]
										? 'bg-neutral-200 dark:bg-neutral-800'
										: 'bg-neutral-100 dark:bg-neutral-900'
								} p-2 hover:bg-neutral-200 mb-2 rounded-md select-none cursor-pointer text-black dark:text-white`}
								onClick={() => {
									core.currentConversation.set(item[0]);
								}}
								onDoubleClick={() => {
									setCurrentEdit(item[0]);
								}}
								key={index}
							>
								{currentEdit !== item[0] ? (
									<p>{item[1]?.name || item[0]}</p>
								) : (
									<input
										onKeyDown={(e) => {
											if (e.code === 'Escape') {
												setCurrentEdit('');
											}

											if (e.code === 'Enter') {
												setCurrentEdit('');
											}
										}}
										autoFocus
										className="bg-transparent"
										value={item[1]?.name || ''}
										onChange={(e) => {
											core.conversations.patchObject({
												[item[0] as any]: {
													...item[1],
													name: e.currentTarget.value,
												},
											});
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
