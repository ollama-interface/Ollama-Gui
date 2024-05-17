import { core, ollamaRequest } from '@/core';

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

// TODO: Work on it
export async function updateModelsAvailability(): Promise<boolean> {
	const res = await ollamaRequest('GET', 'api/tags');
	if (res?.data?.models) {
		core.installedModels.set(res.data.models);

		return true;
	} else {
		throw 'No models has been found';
	}
}
