import { core, ollamaRequest } from '@/core';

export const TryConnect = async () => {
  try {
    await ollamaRequest('GET', '');
    core.server_connected.set(true);
  } catch (error) {
    core.server_connected.set(false);
  }
};
