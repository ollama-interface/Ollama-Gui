import { isRunningUpdate } from '@/app/helper';
import * as React from 'react';

/**
 * @description This hook will make sure that it will check every 30 seconds if the ollama server is running.
 */
export function useRunningPoll() {
	React.useEffect(() => {
		const timeoutID = setInterval(() => {
			isRunningUpdate();
		}, 1500);
		return () => {
			clearInterval(timeoutID);
		};
	}, []);
}
