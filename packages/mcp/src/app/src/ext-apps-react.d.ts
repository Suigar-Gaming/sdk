// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

declare module '@modelcontextprotocol/ext-apps/react' {
	import type { App } from '@modelcontextprotocol/ext-apps';
	import type { Implementation } from '@modelcontextprotocol/sdk/types.js';

	export type McpUiHostContext = {
		theme?: 'light' | 'dark';
		styles?: {
			variables?: Record<string, string | undefined>;
			css?: {
				fonts?: string;
			};
		};
		[key: string]: unknown;
	};

	export interface UseAppOptions {
		appInfo: Implementation;
		capabilities: Record<string, unknown>;
		onAppCreated?: (app: App) => void;
		autoResize?: boolean;
		strict?: boolean;
	}

	export interface AppState {
		app: App | null;
		isConnected: boolean;
		error: Error | null;
	}

	export function useApp(options: UseAppOptions): AppState;
	export function useHostStyles(app: App | null, initialContext?: McpUiHostContext | null): void;
}
