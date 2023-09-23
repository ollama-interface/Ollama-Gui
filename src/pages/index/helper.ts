import { core, official_models, ollamaRequest } from '@/core';
import { IModelType } from '@/core/types';

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

    let x = [...res.data.models] as IModelType[];
    x = x.filter((e) => {
      const mName = e.name;
      const m2Name = official_models.filter((e) => mName === e.name);
      if (!m2Name?.length) {
        return true;
      }
      return false;
    });
    core.unofficial_installed_models.set(x);

    return true;
  } else {
    throw 'No models has been found';
  }
};
