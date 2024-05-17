import { isRunningUpdate } from '@/app/helper';
import { state } from '@/app/state';
import { useSetAtom } from 'jotai';
import * as React from 'react';

/**
 * @description This hook will make sure that it will check every 30 seconds if the ollama server is running.
 */
export function useRunningPoll() {
	const setConnected = useSetAtom(state.app.connected);
	React.useEffect(() => {
		const timeoutID = setInterval(async () => {
			setConnected(await isRunningUpdate());
		}, 1500);
		return () => {
			clearInterval(timeoutID);
		};
	}, []);
}
