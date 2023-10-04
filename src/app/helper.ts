import { core, ollamaRequest } from '@/core';

export const TryConnect = async () => {
  try {
    await ollamaRequest('GET', '');
    core.server_connected.set(true);
  } catch (error) {
    core.server_connected.set(false);
  }
};

export const checkIsRunningUpdate = async () => {
  try {
    await ollamaRequest('GET', '');
    core.server_connected.set(true);
  } catch (error) {
    core.server_connected.set(false);
    throw error;
  }
};

export const UpdateModelsAvailability = async (): Promise<boolean> => {
  const res = await ollamaRequest('GET', 'api/tags');
  if (res?.data?.models) {
    core.installed_models.set(res.data.models);

    return true;
  } else {
    throw 'No models has been found';
  }
};
