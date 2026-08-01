// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	App,
	applyDocumentTheme,
	applyHostFonts,
	applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { StrictMode, useEffect, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
	ExecutionApproval,
	Header,
	ListPanel,
	Panel,
	RawPayload,
} from './components/inspector-components.js';
import { asRecord } from './lib/format.js';
import type { InspectorState } from './lib/types.js';
import { resolveAppView } from './views/index.js';

const initialState: InspectorState = {
	status: 'Waiting for tool result',
	payload: {},
	errors: [],
};

const shellClassName =
	'mx-auto grid min-h-dvh max-w-6xl content-start gap-4 bg-background p-3.5 text-foreground sm:p-4.5';

const textErrors = (result: CallToolResult) =>
	result.content?.flatMap((item) =>
		item.type === 'text' && item.text ? [item.text] : [],
	) ?? [];

type McpUiHostContext = {
	theme?: Parameters<typeof applyDocumentTheme>[0];
	styles?: {
		variables?: Parameters<typeof applyHostStyleVariables>[0];
		css?: {
			fonts?: Parameters<typeof applyHostFonts>[0];
		};
	};
};

type AppViewState = {
	error: Error | null;
	hostContext: McpUiHostContext | undefined;
	inspector: InspectorState | null;
};

type AppViewAction =
	| {
			type: 'connection-error';
			error: Error;
	  }
	| {
			type: 'host-context';
			context: McpUiHostContext | undefined;
	  }
	| {
			type: 'tool-input';
	  }
	| {
			type: 'tool-result';
			payload: unknown;
			status: string;
	  }
	| {
			type: 'tool-error';
			errors: Array<string>;
			payload: unknown;
	  };

const reducer = (state: AppViewState, action: AppViewAction): AppViewState => {
	switch (action.type) {
		case 'connection-error':
			return { ...state, error: action.error };
		case 'host-context':
			return { ...state, hostContext: action.context };
		case 'tool-input':
			return {
				...state,
				// A host delivers arguments before it delivers the tool result. Those
				// arguments are not inspector data, so rendering them creates an empty
				// Transaction Inspector above the actual result.
				inspector: null,
			};
		case 'tool-result':
			return {
				...state,
				inspector: {
					status: action.status,
					payload: action.payload,
					errors: [],
				},
			};
		case 'tool-error':
			return {
				...state,
				inspector: {
					status: 'Error',
					payload: action.payload,
					errors: action.errors,
				},
			};
	}
};

function applyHostContext(context: McpUiHostContext | undefined) {
	if (!context) {
		return;
	}
	if (context.theme) {
		applyDocumentTheme(context.theme);
	}
	if (context.styles?.variables) {
		applyHostStyleVariables(context.styles.variables);
	}
	if (context.styles?.css?.fonts) {
		applyHostFonts(context.styles.css.fonts);
	}
}

export function SuigarInspectorApp() {
	const [viewState, dispatch] = useReducer(reducer, {
		error: null,
		hostContext: undefined,
		inspector: null,
	});
	const [app] = useState(
		() =>
			new App(
				{
					name: 'suigar-mcp-app',
					version: __SUIGAR_MCP_APP_VERSION__,
				},
				{},
			),
	);
	const connectStarted = useRef(false);

	useEffect(() => {
		if (connectStarted.current) {
			return;
		}
		connectStarted.current = true;

		// oxlint-disable-next-line typescript/no-deprecated
		app.ontoolinput = () => {
			dispatch({ type: 'tool-input' });
		};
		// oxlint-disable-next-line typescript/no-deprecated
		app.ontoolresult = (result) => {
			if (result.isError) {
				const errors = textErrors(result);
				dispatch({
					type: 'tool-error',
					payload: result,
					errors: errors.length > 0 ? errors : ['Tool call failed.'],
				});
				return;
			}

			const payload = result.structuredContent ?? result;
			const record =
				payload && typeof payload === 'object'
					? (payload as Record<string, unknown>)
					: {};
			const execution = asRecord(record.execution);
			dispatch({
				type: 'tool-result',
				status:
					typeof record.mode === 'string'
						? record.mode
						: typeof execution.status === 'string'
							? execution.status
							: 'read',
				payload,
			});
		};
		// oxlint-disable-next-line typescript/no-deprecated
		app.onhostcontextchanged = ({ context }) => {
			dispatch({ type: 'host-context', context });
			applyHostContext(context);
		};

		app
			.connect()
			.then(() => {
				const context = app.getHostContext();
				dispatch({ type: 'host-context', context });
				applyHostContext(context);
			})
			.catch((connectError: unknown) => {
				dispatch({
					type: 'connection-error',
					error:
						connectError instanceof Error
							? connectError
							: new Error(String(connectError)),
				});
			});
	}, [app]);

	const inspector = viewState.inspector ?? initialState;
	const { coinBadge, title, View } = resolveAppView(inspector.payload);
	const execution = asRecord(asRecord(inspector.payload).execution);
	const approvalUrl =
		typeof execution.approvalUrl === 'string' ? execution.approvalUrl : null;

	if (viewState.error) {
		return (
			<main className={shellClassName}>
				<Header status="Error" title={title} />
				<ListPanel
					className="errors"
					items={[viewState.error.message]}
					title="Errors"
				/>
			</main>
		);
	}

	if (!viewState.hostContext && !viewState.inspector) {
		return (
			<main className={shellClassName}>
				<Header status="Connecting" title="Suigar MCP" />
				<Panel title="Connection">
					<p className="text-xs leading-5 font-semibold text-muted-foreground">
						Waiting for host context.
					</p>
				</Panel>
			</main>
		);
	}

	if (Object.keys(asRecord(inspector.payload)).length === 0) {
		return null;
	}

	return (
		<main className={shellClassName}>
			<Header coinBadge={coinBadge} status={inspector.status} title={title} />
			<ExecutionApproval url={approvalUrl} />
			<View payload={inspector.payload} errors={inspector.errors} />
			<RawPayload payload={inspector.payload} />
		</main>
	);
}

createRoot(document.querySelector<HTMLDivElement>('#root')!).render(
	<StrictMode>
		<SuigarInspectorApp />
	</StrictMode>,
);
