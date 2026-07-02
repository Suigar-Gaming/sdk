// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	App,
	applyDocumentTheme,
	applyHostFonts,
	applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
	StrictMode,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
	DefinitionList,
	Header,
	ListPanel,
	Panel,
	RawPayload,
} from './components/inspector-components.js';
import { visibleDefinitionEntries } from './lib/format.js';
import { createInspectorViewModel } from './lib/inspector.js';
import type { InspectorState } from './lib/types.js';

const initialState: InspectorState = {
	status: 'Waiting for tool result',
	payload: {},
	errors: [],
};

const textErrors = (result: CallToolResult) =>
	result.content?.flatMap((item) =>
		item.type === 'text' && item.text ? [item.text] : [],
	) ?? [];

type HostContext = NonNullable<ReturnType<App['getHostContext']>>;

type AppViewState = {
	error: Error | null;
	hostContext: HostContext | undefined;
	inspector: InspectorState;
};

type AppViewAction =
	| {
			type: 'connection-error';
			error: Error;
	  }
	| {
			type: 'host-context';
			context: HostContext | undefined;
	  }
	| {
			type: 'tool-input';
			payload: unknown;
	  }
	| {
			type: 'tool-result';
			payload: unknown;
			status: string;
	  }
	| {
			type: 'tool-error';
			errors: string[];
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
				inspector: {
					status: 'Running tool',
					payload: action.payload,
					errors: [],
				},
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

function applyHostContext(context: HostContext | undefined) {
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
		inspector: initialState,
	});
	const [app] = useState(
		() =>
			new App(
				{
					name: 'suigar-transaction-inspector',
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

		app.ontoolinput = ({ arguments: args }) => {
			dispatch({
				type: 'tool-input',
				payload: args ?? {},
			});
		};
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
			dispatch({
				type: 'tool-result',
				status: record.mode ? String(record.mode) : 'read',
				payload,
			});
		};
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

	const viewModel = useMemo(
		() =>
			createInspectorViewModel(
				viewState.inspector.payload,
				viewState.inspector.errors,
			),
		[viewState.inspector.errors, viewState.inspector.payload],
	);

	if (viewState.error) {
		return (
			<main className="mx-auto grid min-h-dvh max-w-6xl gap-4 bg-background p-3.5 text-foreground sm:p-4.5">
				<Header status="Error" />
				<ListPanel
					className="errors"
					items={[viewState.error.message]}
					title="Errors"
				/>
			</main>
		);
	}

	if (!viewState.hostContext) {
		return (
			<main className="mx-auto grid min-h-dvh max-w-6xl gap-4 bg-background p-3.5 text-foreground sm:p-4.5">
				<Header status="Connecting" />
				<RawPayload payload={viewState.inspector.payload} />
			</main>
		);
	}

	return (
		<main className="mx-auto grid min-h-dvh max-w-6xl gap-4 bg-background p-3.5 text-foreground sm:p-4.5">
			<Header status={viewState.inspector.status} />

			<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
				<Panel title="Context">
					<DefinitionList entries={viewModel.contextEntries} />
				</Panel>

				<Panel
					hidden={
						visibleDefinitionEntries(viewModel.transactionEntries).length === 0
					}
					title="Transaction"
				>
					<DefinitionList entries={viewModel.transactionEntries} />
				</Panel>

				<Panel
					hidden={visibleDefinitionEntries(viewModel.gasEntries).length === 0}
					title="Gas"
				>
					<DefinitionList entries={viewModel.gasEntries} />
				</Panel>

				<Panel
					hidden={
						visibleDefinitionEntries(viewModel.dryRunEntries).length === 0
					}
					title="Dry-run"
				>
					<DefinitionList entries={viewModel.dryRunEntries} />
				</Panel>
			</section>

			<ListPanel
				className="targets"
				items={viewModel.targets}
				title="Targets"
			/>
			<ListPanel className="notes" items={viewModel.notes} title="Notes" />
			<ListPanel className="errors" items={viewModel.errors} title="Errors" />
			<RawPayload payload={viewState.inspector.payload} />
		</main>
	);
}

createRoot(document.querySelector<HTMLDivElement>('#root')!).render(
	<StrictMode>
		<SuigarInspectorApp />
	</StrictMode>,
);
