// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readdir, readFile, writeFile } from 'node:fs/promises';

const packagesDir = new URL('../packages/', import.meta.url);

function hasErrorCode(error, code) {
	return error instanceof Error && 'code' in error && error.code === code;
}

async function readJson(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function replaceVersionInFile(path, version) {
	const source = await readFile(path, 'utf8');
	const versionPattern = /^(\s*"version"\s*:\s*")[^"]+(")/m;
	const nextSource = source.replace(versionPattern, `$1${version}$2`);

	if (nextSource === source && !versionPattern.test(source)) {
		throw new Error(`Missing version field in ${path.pathname}`);
	}

	if (nextSource !== source) {
		await writeFile(path, nextSource);
	}
}

for (const directory of await readdir(packagesDir, { withFileTypes: true })) {
	if (!directory.isDirectory()) {
		continue;
	}

	const packageDir = new URL(`${directory.name}/`, packagesDir);
	const packageJsonPath = new URL('package.json', packageDir);
	const jsrJsonPath = new URL('jsr.json', packageDir);
	const packageJson = await readJson(packageJsonPath);

	if (packageJson.private === true) {
		continue;
	}

	let jsrJson;
	try {
		jsrJson = await readJson(jsrJsonPath);
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

	await replaceVersionInFile(jsrJsonPath, packageJson.version);
}
