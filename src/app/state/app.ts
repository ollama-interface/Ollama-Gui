import { atom } from 'jotai';

export const lastResponseTime = atom<number | undefined>(undefined);
export const generating = atom(false);
// export const model = atom<string>('llama3');
