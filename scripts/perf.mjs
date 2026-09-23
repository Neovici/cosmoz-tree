import { Tree } from '../src/cosmoz-tree.ts';
import process from 'node:process';

const SIZES = [10000, 100000, 500000];
const DEFAULT_WARMUP = 5;
const DEFAULT_ITERATIONS = 30;
const FUZZY_WARMUP = 3;
const FUZZY_ITERATIONS = 20;
const JSON_MODE = process.argv.includes('--json');

const createLargeTreeData = (size, branchFactor = 8) => {
	const rootKey = '1';
	const root = {
		id: `id-${rootKey}`,
		name: `Node${rootKey}`,
		pathLocator: rootKey,
		children: {},
	};
	const pathById = {
		[root.id]: root.pathLocator,
	};

	const queue = [root];
	const treeData = { [rootKey]: root };
	let nextNodeId = 2;

	while (nextNodeId <= size && queue.length > 0) {
		const parent = queue.shift();

		for (let i = 0; i < branchFactor && nextNodeId <= size; i += 1) {
			const key = String(nextNodeId);
			const child = {
				id: `id-${key}`,
				name: `Node${key}`,
				pathLocator: `${parent.pathLocator}.${key}`,
				children: {},
			};

			parent.children[key] = child;
			pathById[child.id] = child.pathLocator;
			queue.push(child);
			nextNodeId += 1;
		}
	}

	return {
		treeData,
		pathById,
	};
};

const quantile = (values, q) => {
	if (values.length === 0) {
		return 0;
	}

	const sorted = values.slice().sort((a, b) => a - b);
	const index = Math.min(
		sorted.length - 1,
		Math.max(0, Math.ceil(sorted.length * q) - 1),
	);

	return sorted[index];
};

const measure = async (run, iterations, warmup = DEFAULT_WARMUP) => {
	for (let i = 0; i < warmup; i += 1) {
		await run();
	}

	const samples = [];

	for (let i = 0; i < iterations; i += 1) {
		const start = performance.now();
		await run();
		samples.push(performance.now() - start);
	}

	return {
		median: quantile(samples, 0.5),
		p95: quantile(samples, 0.95),
	};
};

const runBench = async ({ label, size, runCold, runWarm, warmup, iterations }) => {
	const coldStart = performance.now();
	await runCold();
	const coldMs = performance.now() - coldStart;
	const warm = await measure(runWarm, iterations, warmup);

	return {
		label,
		size,
		coldMs,
		warmMedianMs: warm.median,
		warmP95Ms: warm.p95,
		speedupRatio:
			warm.median > 0 ? coldMs / warm.median : Number.POSITIVE_INFINITY,
	};
};

const formatHuman = (row) => {
	return [
		'PERF_RESULT',
		`api=${row.label}`,
		`size=${row.size}`,
		`coldMs=${row.coldMs.toFixed(4)}`,
		`warmMedianMs=${row.warmMedianMs.toFixed(4)}`,
		`warmP95Ms=${row.warmP95Ms.toFixed(4)}`,
		`speedup=${row.speedupRatio.toFixed(1)}x`,
	].join(' ');
};

const createIsolatedTreeBench = async ({
	label,
	size,
	treeData,
	run,
	warmup,
	iterations,
}) => {
	const tree = new Tree(treeData);

	return runBench({
		label,
		size,
		runCold: () => run(tree),
		runWarm: () => run(tree),
		warmup,
		iterations,
	});
};

const run = async () => {
	const results = [];

	for (const size of SIZES) {
		const { treeData, pathById } = createLargeTreeData(size);
		const targetIndex = Math.max(2, Math.floor(size * 0.9));
		const targetId = `id-${targetIndex}`;
		const targetNamePrefix = `Node${String(targetIndex).slice(0, 3)}`;
		const targetPath = pathById[targetId];

		if (!targetPath) {
			throw new Error(`Unable to locate seed node for size ${size}`);
		}

		results.push(
			await createIsolatedTreeBench({
				label: 'getNodeByProperty(id)',
				size,
				treeData,
				run: (tree) => tree.getNodeByProperty(targetId, 'id'),
				warmup: DEFAULT_WARMUP,
				iterations: DEFAULT_ITERATIONS,
			}),
			await createIsolatedTreeBench({
				label: 'getNodeByPathLocator',
				size,
				treeData,
				run: (tree) => tree.getNodeByPathLocator(targetPath),
				warmup: DEFAULT_WARMUP,
				iterations: DEFAULT_ITERATIONS,
			}),
			await createIsolatedTreeBench({
				label: 'getPathNodes',
				size,
				treeData,
				run: (tree) => tree.getPathNodes(targetPath),
				warmup: DEFAULT_WARMUP,
				iterations: DEFAULT_ITERATIONS,
			}),
			await createIsolatedTreeBench({
				label: 'searchNodes exact id',
				size,
				treeData,
				run: (tree) => tree.searchNodes(targetId, undefined, true, 'id'),
				warmup: DEFAULT_WARMUP,
				iterations: DEFAULT_ITERATIONS,
			}),
			await createIsolatedTreeBench({
				label: 'searchNodes fuzzy name',
				size,
				treeData,
				run: (tree) =>
					tree.searchNodes(targetNamePrefix, undefined, false, 'name'),
				warmup: FUZZY_WARMUP,
				iterations: FUZZY_ITERATIONS,
			}),
		);
	}

	/* eslint-disable no-console */
	if (JSON_MODE) {
		for (const row of results) {
			console.log(`PERF_RESULT_JSON ${JSON.stringify(row)}`);
		}

		console.log(`PERF_SUMMARY_JSON ${JSON.stringify(results)}`);
	} else {
		for (const row of results) {
			console.log(formatHuman(row));
		}
	}
	/* eslint-enable no-console */
};

run();
