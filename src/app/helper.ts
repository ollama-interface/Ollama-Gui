import { core, ollamaRequest } from '@/core';
import { useSetAtom } from 'jotai';
import { state } from './state';
import { useCallback } from 'react';
import { ResultAsync } from 'neverthrow';
import Immutable from 'immutable';
import { toast } from '@/components/ui/use-toast';

export async function tryConnect() {
	try {
		await ollamaRequest('GET', '');
		core.serverConnected.set(true);
	} catch (error) {
		core.serverConnected.set(false);
	}
}

export async function isRunningUpdate() {
	try {
		await ollamaRequest('GET', '');
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateModelsAvailability(): Promise<boolean> {
	const res = await ollamaRequest('GET', 'api/tags');
	if (res?.data?.models) {
		core.installedModels.set(res.data.models);

		return true;
	} else {
		throw 'No models has been found';
	}
}

export function useRequestUpdateModels() {
	const setModels = useSetAtom(state.app.models);
	return useCallback(async () => {
		const res = await ResultAsync.fromPromise(
			ollamaRequest<{
				models: string[];
			}>('GET', 'api/tags'),
			(e) => {
				console.error(e);
				return 'Failed to fetch models';
			},
		);
		res.match(
			({ data }) =>
				setModels({ status: 'loaded', value: Immutable.List(data.models) }),
			(error) => {
				setModels({ status: 'loaded', value: Immutable.List() });
				toast({
					variant: 'destructive',
					title: 'Error',
					description: error,
				});
			},
		);
	}, [setModels]);
}
