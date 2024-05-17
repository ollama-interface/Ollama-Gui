import { atom } from 'jotai';
import { atomPersist } from './persist';

export const lastResponseTime = atom<number | undefined>(undefined);
export const generating = atom<string | undefined>(undefined);
export const connected = atom<boolean>(false);
export const visited = atomPersist(
	'VISITED',
	false,
	String,
	(x) => x === 'true',
);
// export const model = atom<string>('llama3');
