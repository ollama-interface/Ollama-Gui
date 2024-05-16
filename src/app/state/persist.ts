import * as idb from 'idb';
import { atom } from 'jotai';

const FIELD = 'keyval';

const dbPromise = idb.openDB('db', 1, {
	upgrade(db) {
		db.createObjectStore(FIELD);
	},
});

export const db = {
	async save(key: string, value: string) {
		const db = await dbPromise;
		await db.put(FIELD, value, key);
	},
	async load(key: string): Promise<string | undefined> {
		const db = await dbPromise;
		return db.get(FIELD, key);
	},
	async delete(key: string) {
		const db = await dbPromise;
		return db.delete(FIELD, key);
	},
};

export type AsyncAtomValue<T> =
	| {
			status: 'loading';
	  }
	| {
			status: 'loaded';
			value: T;
	  }
	| {
			status: 'error';
			error: unknown;
	  };

export function atomWithAsyncStorage<T>(
	onLoad: () => Promise<T>,
	onSave: (value: T) => void,
) {
	const baseAtom = atom<AsyncAtomValue<T>>({ status: 'loading' });
	baseAtom.onMount = (setValue) => {
		(async () => {
			try {
				const item = await onLoad();
				setValue({
					status: 'loaded',
					value: item,
				});
			} catch (error) {
				setValue({
					status: 'error',
					error,
				});
			}
		})();
	};
	const derivedAtom = atom(
		(get) => get(baseAtom),
		(get, set, update: (value: T) => T) => {
			const value = get(baseAtom);
			if (value.status !== 'loaded') {
				console.error('Tried to update an atom that is still loading');
				return;
			}
			const nextValue = update(value.value);
			set(baseAtom, {
				status: 'loaded',
				value: nextValue,
			});
			onSave(nextValue);
		},
	);
	return derivedAtom;
}

export function atomPersist<T>(
	key: string,
	defaultValue: T,
	toString: (value: T) => string = JSON.stringify,
	fromString: (value: string) => T = JSON.parse,
) {
	const initial = (() => {
		try {
			const item = localStorage.getItem(key);
			if (item) {
				return fromString(item);
			} else {
				return defaultValue;
			}
		} catch (error) {
			return defaultValue;
		}
	})();
	const item = atom<T>(initial);
	const derivedAtom = atom(
		(get) => get(item),
		(_get, set, newValue: T) => {
			set(item, newValue);
			localStorage.setItem(key, toString(newValue));
		},
	);

	return derivedAtom;
}
