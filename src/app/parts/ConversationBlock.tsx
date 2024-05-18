import { memo } from 'react';
import dayjs from 'dayjs';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { Markdown } from '@/components/markdown';
import { Conversation } from '../state/conversation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ollamaAvatar from '../assets/ollama_avatar.png';

export interface Props {
	conversation: Conversation;
}

export const OllamaAvatarPrerender = (
	<div className="p-2">
		<Avatar>
			<AvatarImage src={ollamaAvatar} />
			<AvatarFallback>OL</AvatarFallback>
		</Avatar>
	</div>
);

export const ConversationBlock = memo(function ConversationBlock(p: Props) {
	return (
		<>
			{p.conversation.chatHistory.map((item, index) => (
				<div
					key={index}
					className={` relative w-full flex ${
						item.who === 'me' ? 'justify-end' : ''
					}`}
				>
					{item.who === 'ollama' && OllamaAvatarPrerender}
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
					{item.who === 'me' && (
						<p className="ml-2 mt-2.5 text-neutral-400">You</p>
					)}
				</div>
			))}
		</>
	);
});
