export * from './utils';
export * from './core';
export * from './helper';

export const OLLAMA_HOST = `127.0.0.1:11435`;
export const OLLAMA_COMMAND = `OLLAMA_ORIGINS=* OLLAMA_HOST=${OLLAMA_HOST} ollama serve`;

export const official_models = [
  {
    name: 'llama2:latest',
  },
  {
    name: 'llama2:13b',
  },
  {
    name: 'llama2:70b',
  },
  {
    name: 'llama2-uncensored:latest',
  },
  {
    name: 'codellama:latest',
  },
  {
    name: 'orca-mini',
  },
  {
    name: 'vicuna',
  },
  {
    name: 'nous-hermes',
  },
  {
    name: 'nous-hermes:13b',
  },
  {
    name: 'wizard-vicuna',
  },
];
