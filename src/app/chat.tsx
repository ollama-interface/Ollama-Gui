import { memo, useRef } from 'react';
import { ConversationBlock } from './parts/ConversationBlock';
import { useSimple } from 'simple-core-state';
import { core } from '@/core';
import { Skeleton } from '@/components/ui/skeleton';

export default memo(function Chat() {
	const chatRef = useRef<HTMLDivElement>(null);
	const conversations = useSimple(core.conversations);
	const currentConversation = useSimple(core.currentConversation);
	const generating = useSimple(core.generating);
	return (
		<div className="h-full w-full flex flex-row overflow-hidden">
			<div ref={chatRef} className="w-full overflow-y-scroll px-4">
				<ConversationBlock
					conversations={conversations}
					currentConversation={currentConversation}
				/>
				{generating && (
					<Skeleton className="w-full h-[20px] rounded-full m-2 animate-pulse" />
				)}
			</div>
		</div>
	);
});
