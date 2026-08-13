'use client';

import * as React from 'react';
import { EventLogContext } from '@/components/providers/event-log-context';

export function useEventLog() {
	const context = React.use(EventLogContext);

	if (!context) {
		throw new Error('useEventLog must be used inside EventLogProvider');
	}

	return context;
}
