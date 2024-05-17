import { atom } from 'jotai';

export const lastResponseTime = atom<number | undefined>(undefined);
export const generating = atom<string | undefined>(undefined);
// export const model = atom<string>('llama3');
