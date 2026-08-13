'use client';

import * as React from 'react';
import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PersistentFormsStore<T> = {
	value: T;
	setValue: (nextValue: T | ((currentValue: T) => T)) => void;
};

const persistentFormStores = new Map<
	string,
	UseBoundStore<StoreApi<PersistentFormsStore<unknown>>>
>();

function getPersistentFormsStore<T>(key: string, initialValue: T) {
	const existingStore = persistentFormStores.get(key) as
		| UseBoundStore<StoreApi<PersistentFormsStore<T>>>
		| undefined;
	if (existingStore) {
		return existingStore;
	}

	const store = create<PersistentFormsStore<T>>()(
		persist(
			(set) => ({
				value: initialValue,
				setValue: (nextValue) =>
					set((current) => ({
						value:
							typeof nextValue === 'function'
								? (nextValue as (currentValue: T) => T)(current.value)
								: nextValue,
					})),
			}),
			{
				name: key,
				storage: createJSONStorage(() => localStorage),
			},
		),
	);

	persistentFormStores.set(key, store as UseBoundStore<StoreApi<PersistentFormsStore<unknown>>>);

	return store;
}

export function usePersistentForms<T>(key: string, initialValue: T) {
	const store = React.useMemo(
		() => getPersistentFormsStore(key, initialValue),
		[key, initialValue],
	);

	const value = store((state) => state.value);
	const setValue = store((state) => state.setValue);

	return [value, setValue] as const;
}
