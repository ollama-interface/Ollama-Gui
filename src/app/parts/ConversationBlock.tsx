import { memo } from 'react';
import dayjs from 'dayjs';
import { Conversations } from '@/core/types';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { Markdown } from '@/components/markdown';

export interface Props {
	conversations: Conversations;
	currentConversation: string;
}

export const ConversationBlock = memo(function ConversationBlock(p: Props) {
	return (
		<>
			{p.conversations[p.currentConversation]?.chatHistory?.map(
				(item, index) => (
					<div
						key={index}
						className={` relative w-full flex ${
							item.who === 'ollama' ? 'justify-end' : ''
						}`}
					>
						{item.who === 'me' && (
							<p className="mr-2 mt-2.5 text-neutral-400">You</p>
						)}
						<div
							className={`right-0 flex flex-col mb-10 bg-zinc-100 dark:bg-zinc-900 border-solid border-neutral-200 dark:border-neutral-800  border rounded-xl p-2 w-[80%]`}
						>
							{item.txt?.map((txtItem, txtIndex) => {
								if (txtItem.type === 'text') {
									return (
										<Markdown
											key={txtIndex}
											className="text-left text-neutral-700 dark:text-neutral-300"
											components={{
												code(props) {
													const { children, className, key } = props;
													const match = /language-(\w+)/.exec(className || '');
													return (
														<CodeEditor
															disabled={true}
															contentEditable={false}
															key={key}
															className="bg-neutral-800 dark:bg-black rounded-md my-2"
															language={match?.[1] ?? 'text'}
															value={String(children)}
															data-color-mode="dark"
															style={{
																fontSize: 12,
																fontFamily:
																	'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
															}}
														/>
													);
												},
											}}
										>
											{txtItem.content}
										</Markdown>
									);
								}
							})}

							<p className="absolute bottom-[20px] text-xs text-neutral-500">
								{dayjs(item.created_at).format('HH:MM:ss')}
							</p>
						</div>
						{item.who === 'ollama' && (
							<p className="ml-2 mt-2.5 text-neutral-400">Ollama</p>
						)}
					</div>
				)
			)}
			{p.conversations[p.currentConversation].chatHistory?.length === 0 && (
				<p className="text-neutral-400 dark:text-neutral-600 text-center mt-10">
					No message
				</p>
			)}
		</>
	);
});
