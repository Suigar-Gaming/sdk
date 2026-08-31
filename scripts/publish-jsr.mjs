// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACE_CONFIG_FILE = 'pnpm-workspace.yaml';
const startDir = process.cwd();
const workspaceRoot = findUp(startDir, WORKSPACE_CONFIG_FILE);
const catalogVersions = readCatalogVersions(join(workspaceRoot, WORKSPACE_CONFIG_FILE));
const workspacePackages = readWorkspacePackages(workspaceRoot);
const publishArgs = process.argv.slice(2);

for (const packageDir of getPublishablePackageDirs(startDir)) {
	publishPackage(packageDir);
}

function publishPackage(packageDir) {
	const packageJson = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
	const jsrJson = JSON.parse(readFileSync(join(packageDir, 'jsr.json'), 'utf8'));
	const stageDir = mkdtempSync(join(tmpdir(), `${packageJson.name.replaceAll('/', '__')}-jsr-`));

	try {
		writeFileSync(join(stageDir, 'jsr.json'), `${JSON.stringify(createJsrJson(jsrJson), null, '\t')}\n`);

		for (const entry of jsrJson.publish?.include ?? []) {
			copyIncludedPath(packageDir, stageDir, entry);
		}

		writeFileSync(
			join(stageDir, 'package.json'),
			`${JSON.stringify(createJsrPackageJson(packageJson), null, '\t')}\n`,
		);

		const nodeModulesPath = join(packageDir, 'node_modules');
		if (existsSync(nodeModulesPath)) {
			symlinkSync(nodeModulesPath, join(stageDir, 'node_modules'), 'dir');
		}

		const jsrBin = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '.bin', 'jsr');
		const result = spawnSync(jsrBin, ['publish', ...getPublishArgs(jsrJson), ...publishArgs], {
			cwd: stageDir,
			env: process.env,
			stdio: 'inherit',
		});

		if (result.status !== 0) {
			process.exit(result.status ?? 1);
		}
	} finally {
		rmSync(stageDir, { recursive: true, force: true });
	}
}

function copyIncludedPath(packageDir, stageDir, entry) {
	const source = join(packageDir, entry);

	if (!existsSync(source)) {
		throw new Error(`JSR publish include path does not exist: ${entry}`);
	}

	const destination = join(stageDir, entry);
	cpSync(source, destination, { recursive: statSync(source).isDirectory() });
}

function getPublishArgs(jsrJson) {
	if (jsrJson.allowSlowTypes === true && !publishArgs.includes('--allow-slow-types')) {
		return ['--allow-slow-types'];
	}

	return [];
}

function createJsrJson(source) {
	const jsrJson = { ...source };
	delete jsrJson.allowSlowTypes;

	return jsrJson;
}

function createJsrPackageJson(source) {
	const dependencies = {
		...resolveDependencies(source.dependencies),
		...resolveDependencies(source.peerDependencies),
	};

	return {
		name: source.name,
		version: source.version,
		type: source.type,
		dependencies,
	};
}

function resolveDependencies(dependencies = {}) {
	const resolved = {};

	for (const [name, range] of Object.entries(dependencies)) {
		if (typeof range !== 'string') {
			continue;
		}

		if (range.startsWith('catalog:')) {
			const catalogName = range.slice('catalog:'.length);
			const catalogRange = catalogVersions.get(`${catalogName}:${name}`);

			if (!catalogRange) {
				throw new Error(`No catalog version found for ${name} in catalog ${catalogName}`);
			}

			resolved[name] = catalogRange;
			continue;
		}

		if (range.startsWith('workspace:')) {
			const workspacePackage = workspacePackages.get(name);

			if (!workspacePackage) {
				throw new Error(`No workspace package found for ${name}`);
			}

			resolved[name] = `npm:${toJsrNpmPackageName(name)}@^${workspacePackage.version}`;
			continue;
		}

		resolved[name] = range;
	}

	return resolved;
}

function getPublishablePackageDirs(start) {
	if (existsSync(join(start, 'package.json')) && existsSync(join(start, 'jsr.json'))) {
		return [start];
	}

	const packageDirsByName = new Map();
	const packagesDir = join(workspaceRoot, 'packages');

	for (const directory of readdirSync(packagesDir, { withFileTypes: true })) {
		if (!directory.isDirectory()) {
			continue;
		}

		const packageDir = join(packagesDir, directory.name);

		if (existsSync(join(packageDir, 'package.json')) && existsSync(join(packageDir, 'jsr.json'))) {
			const packageJson = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
			packageDirsByName.set(packageJson.name, packageDir);
		}
	}

	return sortPackageDirsByWorkspaceDependencies(packageDirsByName);
}

function toJsrNpmPackageName(name) {
	const [scope, packageName] = name.split('/');

	if (!scope?.startsWith('@') || !packageName) {
		throw new Error(`Workspace dependency ${name} cannot be converted to a JSR npm package name`);
	}

	return `@jsr/${scope.slice(1)}__${packageName}`;
}

function sortPackageDirsByWorkspaceDependencies(packageDirsByName) {
	const sorted = [];
	const visited = new Set();
	const visiting = new Set();

	for (const name of [...packageDirsByName.keys()].sort(compareStrings)) {
		visitPackage(name);
	}

	return sorted;

	function visitPackage(name) {
		if (visited.has(name)) {
			return;
		}

		if (visiting.has(name)) {
			throw new Error(`Circular workspace dependency involving ${name}`);
		}

		const packageDir = packageDirsByName.get(name);
		if (!packageDir) {
			return;
		}

		visiting.add(name);

		const packageJson = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
		const dependencyNames = [
			...Object.keys(packageJson.dependencies ?? {}),
			...Object.keys(packageJson.peerDependencies ?? {}),
		];

		for (const dependencyName of dependencyNames.sort(compareStrings)) {
			if (packageDirsByName.has(dependencyName)) {
				visitPackage(dependencyName);
			}
		}

		visiting.delete(name);
		visited.add(name);
		sorted.push(packageDir);
	}
}

function compareStrings(left, right) {
	return left.localeCompare(right);
}

function readCatalogVersions(workspaceConfigPath) {
	const config = readFileSync(workspaceConfigPath, 'utf8');
	const versions = new Map();
	let inCatalogs = false;
	let currentCatalog = null;

	for (const line of config.split('\n')) {
		if (line === 'catalogs:') {
			inCatalogs = true;
			continue;
		}

		if (!inCatalogs) {
			continue;
		}

		const catalogMatch = line.match(/^ {2}([A-Za-z0-9_-]+):$/);
		if (catalogMatch) {
			currentCatalog = catalogMatch[1];
			continue;
		}

		if (/^\S/.test(line)) {
			currentCatalog = null;
			inCatalogs = false;
			continue;
		}

		const dependencyMatch = line.match(/^ {4}'([^']+)': (.+)$/);
		if (currentCatalog && dependencyMatch) {
			versions.set(`${currentCatalog}:${dependencyMatch[1]}`, dependencyMatch[2].trim());
		}
	}

	return versions;
}

function readWorkspacePackages(root) {
	const packages = new Map();
	const packagesDir = join(root, 'packages');

	for (const directory of readdirSync(packagesDir, { withFileTypes: true })) {
		if (!directory.isDirectory()) {
			continue;
		}

		const packageJsonPath = join(packagesDir, directory.name, 'package.json');

		if (!existsSync(packageJsonPath)) {
			continue;
		}

		const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
		packages.set(manifest.name, {
			name: manifest.name,
			version: manifest.version,
		});
	}

	return packages;
}

function findUp(start, fileName) {
	let directory = start;

	while (directory !== dirname(directory)) {
		if (existsSync(join(directory, fileName))) {
			return directory;
		}

		directory = dirname(directory);
	}

	throw new Error(`Could not find ${fileName} from ${start}`);
}
