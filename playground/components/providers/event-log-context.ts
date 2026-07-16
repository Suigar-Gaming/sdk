'use client';

import * as React from 'react';
import type { EventLogRow } from '@/lib/suigar-types';

export type EventLogContextValue = {
	rows: EventLogRow[];
	addRows: (rows: EventLogRow[]) => void;
	clearRows: () => void;
};

export const EventLogContext = React.createContext<EventLogContextValue | null>(
	null,
);
