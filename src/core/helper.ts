import { core } from './core';
import { ModelTypes } from './types';

export function generateRandomString(length: number): string {
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const num = Math.floor(Math.random() * 10);
    randomString += num.toString();
  }
  return randomString;
}

export const createNewConversation = (m?: ModelTypes) => {
  const id = generateRandomString(5);
  core.conversations.patchObject({
    [id]: { chatHistory: [], ctx: [], model: m || 'llama2' },
  });
  return id;
};
