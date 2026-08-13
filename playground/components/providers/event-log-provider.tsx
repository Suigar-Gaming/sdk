'use client';

import * as React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
	EventLogContext,
	type EventLogContextValue,
} from '@/components/providers/event-log-context';
import type { EventLogRow } from '@/lib/suigar-types';

const STORAGE_KEY = 'suigar-playground:event:logs';

type EventLogStore = {
	rows: Array<EventLogRow>;
	addRows: (rows: Array<EventLogRow>) => void;
	clearRows: () => void;
};

const useEventLogStore = create<EventLogStore>()(
	persist(
		(set) => ({
			rows: [],
			addRows: (incomingRows) =>
				set((state) => ({
					rows: [...incomingRows, ...state.rows],
				})),
			clearRows: () => set({ rows: [] }),
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			skipHydration: true,
		},
	),
);

export function EventLogProvider({ children }: { children: React.ReactNode }) {
	const { rows, addRows, clearRows } = useEventLogStore(
		useShallow((state) => ({
			rows: state.rows,
			addRows: state.addRows,
			clearRows: state.clearRows,
		})),
	);

	React.useEffect(() => {
		void useEventLogStore.persist.rehydrate();
	}, []);

	const value = React.useMemo<EventLogContextValue>(
		() => ({
			rows,
			addRows,
			clearRows,
		}),
		[addRows, clearRows, rows],
	);

	return <EventLogContext.Provider value={value}>{children}</EventLogContext.Provider>;
}
