// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readdir, readFile, writeFile } from 'node:fs/promises';

interface PackageJson {
	name: string;
	version: string;
	private?: boolean;
}

interface JsrJson {
	name: string;
	version: string;
	[key: string]: unknown;
}

const packagesDir = new URL('./packages/', import.meta.url);

function hasErrorCode(error: unknown, code: string): error is Error & { code: string } {
	return error instanceof Error && 'code' in error && (error as { code: unknown }).code === code;
}

async function readJson<T>(path: URL): Promise<T> {
	return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function writeJson(path: URL, value: JsrJson): Promise<void> {
	await writeFile(path, `${JSON.stringify(value, null, '\t')}\n`);
}

for (const directory of await readdir(packagesDir, { withFileTypes: true })) {
	if (!directory.isDirectory()) {
		continue;
	}

	const packageDir = new URL(`${directory.name}/`, packagesDir);
	const packageJsonPath = new URL('package.json', packageDir);
	const jsrJsonPath = new URL('jsr.json', packageDir);
	const packageJson = await readJson<PackageJson>(packageJsonPath);

	if (packageJson.private === true) {
		continue;
	}

	let jsrJson: JsrJson;
	try {
		jsrJson = await readJson<JsrJson>(jsrJsonPath);
	} catch (error) {
		if (hasErrorCode(error, 'ENOENT')) {
			throw new Error(`Missing jsr.json for public package ${packageJson.name}`);
		}

		throw error;
	}

	if (jsrJson.name !== packageJson.name) {
		throw new Error(
			`JSR package name ${jsrJson.name} does not match package.json name ${packageJson.name}`,
		);
	}

	if (jsrJson.version === packageJson.version) {
		continue;
	}

	jsrJson.version = packageJson.version;
	await writeJson(jsrJsonPath, jsrJson);
}
