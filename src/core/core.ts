import { SimpleCore } from 'simple-core-state';
import { ICoreType } from './types';

const instance = new SimpleCore<ICoreType>(
  {
    conversations: {
      session: { chatHistory: [], ctx: [], model: 'llama2' },
    },
    current_conversation: 'session',
    model: 'llama2',
    localAPI: 'http://127.0.0.1:11435',
    installed_models: [
      {
        digest: '1',
        modified_at: '1',
        name: 'example:1',
        size: 1,
      },
    ],
    visited: false,
  },
  { storage: { prefix: 'ollama_web_ui_' } }
);

instance.persist([
  'model',
  'localAPI',
  'visited',
  'conversations',
  'current_conversation',
]);

export const core = instance.core();
