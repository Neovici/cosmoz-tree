import { assert } from '@open-wc/testing';
import { Tree, type Node, type TreeData } from '../src/cosmoz-tree';

/**
 * A sparse tree: the `1.1` branch was never loaded, and the `1.5.3`
 * descendant is stored under its accumulated path locator, which places
 * an undefined in the middle of the `1.5.3` path.
 */
const sparseData: TreeData = {
	'1': {
		id: 'id-1',
		pathLocator: '1',
		name: 'Root',
		children: {
			'1.2': {
				id: 'id-1.2',
				pathLocator: '1.2',
				name: 'Two',
			},
			'1.5.3': {
				id: 'id-1.5.3',
				pathLocator: '1.5.3',
				name: 'Deep',
			},
		},
	},
};

const completeData: TreeData = {
	'1': {
		id: 'id-1',
		pathLocator: '1',
		name: 'Root',
		children: {
			'1.2': {
				id: 'id-1.2',
				pathLocator: '1.2',
				name: 'Two',
				path: '1 / 2',
			},
		},
	},
};

suite('exact path lookups', () => {
	let tree: Tree;

	suiteSetup(() => {
		tree = new Tree(sparseData, {
			exactPathLookup: true,
			pathStringSeparator: ' / ',
		});
	});

	suite('getPathNodes', () => {
		test('an absent subtree answers with no result', () => {
			assert.isUndefined(tree.getPathNodes('1.1'));
		});

		test('a hole in the middle answers with no result', () => {
			assert.isUndefined(tree.getPathNodes('1.5.3'));
		});

		test('a leading segment outside the tree answers with no result', () => {
			assert.isUndefined(tree.getPathNodes('0.1.2'));
		});

		test('a loaded path answers with the full chain', () => {
			assert.deepEqual(
				tree.getPathNodes('1.2')?.map((node) => node?.name),
				['Root', 'Two'],
			);
		});

		test('a missing call argument answers with the tree data', () => {
			assert.deepEqual(tree.getPathNodes(), sparseData);
		});
	});

	suite('getNodeByPathLocator', () => {
		test('an unloaded deeper path returns no node, in exact mode', () => {
			assert.isUndefined(tree.getNodeByPathLocator('1.2.9'));
		});

		test('a loaded path answers with its own node', () => {
			assert.equal(tree.getNodeByPathLocator('1.2')?.name, 'Two');
		});

		test('a missing path locator answers with the roots', () => {
			assert.deepEqual(tree.getNodeByPathLocator(), tree._roots);
		});
	});

	suite('getPathString', () => {
		test('a path with an unknown ancestor gives no path string', () => {
			assert.isUndefined(tree.getPathString('1.5.3'));
		});

		test('a path with a missing intermediate level gives no path string', () => {
			assert.isUndefined(tree.getPathString('1.5'));
		});

		test('a complete path gives the joined path string', () => {
			const complete = new Tree(completeData, {
				exactPathLookup: true,
				pathStringSeparator: ' / ',
			});
			assert.equal(complete.getPathString('1.2'), 'Root / Two');
		});
	});

	suite('loose mode is unchanged', () => {
		let loose: Tree;

		suiteSetup(() => {
			loose = new Tree(sparseData, {
				pathStringSeparator: ' / ',
			});
		});

		test('a missing intermediate level is skipped in the path string', () => {
			assert.equal(loose.getPathString('1.5.3'), 'Root / Deep');
		});

		test('a hole is skipped and the stored descendant answers', () => {
			assert.equal(loose.getNodeByPathLocator('1.5.3')?.name, 'Deep');
		});

		test('a leading segment outside the tree answers with the diverging prefix kept', () => {
			// The loose fallback builds accumulated keys from the requested
			// path, so a diverging leading segment cannot hit an accumulated
			// child key. This pins the pre-existing answer.
			assert.deepEqual(
				loose.getPathNodes('0.1.2')?.map((node) => node?.name),
				['Root', undefined],
			);
		});

		test('a leading segment outside the tree shifts the window on bare-keyed children', () => {
			const bare = new Tree(
				{
					'1': {
						id: 'id-1',
						pathLocator: '1',
						name: 'Root',
						children: {
							'2': { id: 'id-1.2', pathLocator: '1.2', name: 'Two' },
						},
					},
				} as TreeData,
				{ pathStringSeparator: ' / ' },
			);
			assert.deepEqual(
				bare.getPathNodes('0.1.2')?.map((node) => node?.name),
				['Root', 'Two'],
			);
		});
	});

	suite('in place completion with the exact option', () => {
		let tree: Tree;
		let root: Node | undefined;

		suiteSetup(() => {
			tree = new Tree(completeData, {
				exactPathLookup: true,
				pathStringSeparator: ' / ',
			});
			// Populate the id cache for the root before the completion.
			tree.getNodeByProperty('id-1', 'id');
			root = tree.getNodeByPathLocator('1') as Node | undefined;
		});

		test('completing children in place keeps the node identity', () => {
			const completed = root as NonNullable<typeof root>;
			completed.children = {
				'1.2': completeData['1'].children!['1.2'],
				'1.4': {
					id: 'id-1.4',
					pathLocator: '1.4',
					name: 'Four',
				},
			};
			assert.isTrue(tree.hasChildren(completed));
			assert.deepEqual(
				tree.getChildren(completed).map((node) => node.name),
				['Two', 'Four'],
			);
			assert.equal(tree.getNodeByProperty('id-1', 'id'), completed);
		});

		test('a new subtree answers as a full chain after the completion', () => {
			assert.equal(tree.getNodeByPathLocator('1.4')?.name, 'Four');
			assert.equal(tree.getPathString('1.4'), 'Root / Four');
		});
	});
});