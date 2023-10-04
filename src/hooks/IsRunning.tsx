import { checkIsRunningUpdate } from '@/app/helper';
import * as React from 'react';

let timeoutID: NodeJS.Timeout;

/**
 * @description This hook will make sure that it will check every 30 seconds if the ollama server is running.
 */
export const IsRunningHook = () => {
	const Run = () => {
		timeoutID = setInterval(() => {
			checkIsRunningUpdate();
		}, 1500);
	};

	React.useEffect(() => {
		Run();
		return () => {
			clearInterval(timeoutID);
		};
	}, []);
};
