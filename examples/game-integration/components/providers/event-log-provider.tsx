'use client';

import * as React from 'react';
import type { EventLogRow } from '@/lib/suigar-app';

type EventLogContextValue = {
	rows: EventLogRow[];
	addRows: (rows: EventLogRow[]) => void;
	clearRows: () => void;
};

const STORAGE_KEY = 'suigar-example-event-log';

const EventLogContext = React.createContext<EventLogContextValue | null>(null);

export function EventLogProvider({ children }: { children: React.ReactNode }) {
	const [rows, setRows] = React.useState<EventLogRow[]>(() => {
		if (typeof window === 'undefined') {
			return [];
		}

		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}

		try {
			return JSON.parse(raw) as EventLogRow[];
		} catch {
			window.localStorage.removeItem(STORAGE_KEY);
			return [];
		}
	});

	React.useEffect(() => {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
	}, [rows]);

	const value = React.useMemo<EventLogContextValue>(
		() => ({
			rows,
			addRows: (incomingRows) => {
				setRows((currentRows) => [...incomingRows, ...currentRows]);
			},
			clearRows: () => {
				setRows([]);
			},
		}),
		[rows],
	);

	return (
		<EventLogContext.Provider value={value}>
			{children}
		</EventLogContext.Provider>
	);
}

export function useEventLog() {
	const context = React.useContext(EventLogContext);

	if (!context) {
		throw new Error('useEventLog must be used inside EventLogProvider');
	}

	return context;
}
