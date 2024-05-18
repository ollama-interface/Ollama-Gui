import { IntroCard } from '@/app/parts/IntroCard';
import { useState, useEffect } from 'react';
import { useRunningPoll } from '@/hooks';
import Header from './header';
import InputPrompt from './input-prompt';
import Chat from './chat';
import { useAtom } from 'jotai';
import { state } from './state';
import Migrator from './migrator';
import { ErrorBoundary } from '@/components/error-boundry';
import { AlertError } from '@/components/ui/alert';
import Sidebar from './sidebar';

function HomePage() {
	useRunningPoll();

	const [visited, setVisited] = useAtom(state.app.visited);
	const [showIntroCard, setShowIntroCard] = useState(false);

	useEffect(() => {
		if (visited === false) {
			setShowIntroCard(true);
		}
	}, [visited]);

	return (
		<div className="flex flex-row h-full">
			<Migrator />

			<ErrorBoundary
				fallback={
					<AlertError>
						Sidebar has been crashed, please refresh the page
					</AlertError>
				}
			>
				<Sidebar />
			</ErrorBoundary>
			<div className="dark:bg-black h-full w-full flex flex-col justify-center items-center">
				{showIntroCard && (
					<IntroCard
						onClose={(agreed) => {
							if (agreed) {
								setVisited(true);
							}
							setShowIntroCard(false);
						}}
					/>
				)}

				<ErrorBoundary
					fallback={
						<AlertError>
							Header has been crashed, please refresh the page
						</AlertError>
					}
				>
					<Header />
				</ErrorBoundary>

				<ErrorBoundary
					fallback={
						<AlertError>
							Chat has been crashed, please refresh the page
						</AlertError>
					}
				>
					<Chat />
				</ErrorBoundary>
				<div className="flex flex-col w-full pb-[5px] mt-2">
					<InputPrompt />
				</div>
			</div>
		</div>
	);
}

export default HomePage;
