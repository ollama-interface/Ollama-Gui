import { core } from '@/core';
import { IntroCard } from '@/app/parts/IntroCard';
import Sidebar from '@/app/parts/Sidebar';
import { useState, useEffect } from 'react';
import { useSimple } from 'simple-core-state';
import { useRunningPoll } from '@/hooks';
import Header from './header';
import InputPrompt from './input-prompt';
import Chat from './chat';

function HomePage() {
	useRunningPoll();

	const visited = useSimple(core.visited);
	const [showIntroCard, setShowIntroCard] = useState(false);

	useEffect(() => {
		if (visited === false) {
			setShowIntroCard(true);
		}
	}, [visited]);

	return (
		<div className="flex flex-row h-full">
			<Sidebar />
			<div className="dark:bg-black h-full w-full flex flex-col justify-center items-center">
				{showIntroCard && (
					<IntroCard
						onClose={(e) => {
							if (e) core.visited.set(true);
							setShowIntroCard(false);
						}}
					/>
				)}

				<Header />
				<Chat />
				<div className="flex flex-col w-full pb-[5px] mt-2">
					<InputPrompt />
				</div>
			</div>
		</div>
	);
}

export default HomePage;
