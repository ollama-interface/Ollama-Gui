import { SimpleCore } from 'simple-core-state';

const instance = new SimpleCore(
  {
    model: 'llama2',
    localAPI: 'http://127.0.0.1:11434',
    installed_models: [
      {
        digest: '1',
        modified_at: '1',
        name: 'example:1',
        size: 1,
      },
    ],
  },
  { storage: { prefix: 'ollama_web_ui' } }
);

instance.persist(['model', 'localAPI']);

export const core = instance.core();
