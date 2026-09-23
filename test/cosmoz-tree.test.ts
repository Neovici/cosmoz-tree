import { assert } from '@open-wc/testing';
import { Node, Tree } from '../src/cosmoz-tree';
import { treeBaseUrl, treeFromJsonUrl } from './base-data';

const basicTreeUrl = `${treeBaseUrl}/basicTree.json`,
	basicTreePlUrl = `${treeBaseUrl}/basicTreePL.json`,
	multiRootTreeUrl = `${treeBaseUrl}/multiRootTree.json`,
	missingAncestorTreeUrl = `${treeBaseUrl}/missingAncestorTree.json`;

suite('basic', () => {
	let basicTree: Tree;

	suiteSetup(async () => {
		basicTree = await treeFromJsonUrl(basicTreeUrl);
	});

	test('instantiating a Cosmoz.Tree', () => {
		assert.isOk(basicTree);
	});

	test('getNodeByProperty', async () => {
		const root = await basicTree.getNodeByProperty(
				'11111111-1111-1111-1111-111111111111',
				'id',
			),
			node2 = await basicTree.getNodeByProperty(
				'167d1485-7d4f-4c7d-86cd-a4fb00f31245',
				'id',
			),
			node3 = await basicTree.getNodeByProperty(
				'3a7654f1-e3e6-49c7-b6a8-a4fb00f31245',
				'id',
			),
			node4 = await basicTree.getNodeByProperty(
				'2b547550-b874-4228-9395-a4fb00f31245',
				'id',
			),
			node5 = await basicTree.getNodeByProperty(node4?.name),
			node6 = await basicTree.getNodeByProperty(
				node2?.pathLocator,
				'pathLocator',
				basicTree._roots,
			);
		assert.isOk(root);
		assert.isOk(node2);
		assert.isOk(node3);
		assert.isOk(node4);
		assert.deepEqual(node4, node5);
		assert.deepEqual(node2, node6);
		assert.isUndefined(await basicTree.getNodeByProperty());
	});

	test('searchNodes', async () => {
		const root = (
				await basicTree.searchNodes('1', undefined, undefined, 'pathLocator')
			)[0],
			node2 = (
				await basicTree.searchNodes('1', undefined, undefined, 'pathLocator')
			)[0],
			node3 = (
				await basicTree.searchNodes(
					'2b547550-b874-4228-9395-a4fb00f31245',
					undefined,
					undefined,
					'id',
				)
			)[0],
			node4 = await basicTree.searchNodes(node3.name),
			node5 = await basicTree.searchNodes(
				'2b547550-b874-4228-9395-',
				undefined,
				false,
				'id',
			),
			node6 = await basicTree.searchNodes(
				'Node',
				basicTree._roots,
				false,
				'name',
			);

		assert.isOk(root);
		assert.deepEqual(root, node2);
		assert.isOk(node3);
		assert.isAbove(
			node4.indexOf(node3),
			-1,
			'Search by name & id creates no overlap in results.',
		);
		assert.isAbove(
			node5.indexOf(node3),
			-1,
			'There is no overlab in results. "exact" attribute fails.',
		);
		assert.isOk(node6);
	});

	test('findNode', async () => {
		const root: Node = (
				await basicTree.searchNodes('1', undefined, undefined, 'pathLocator')
			)[0],
			node = await basicTree.findNode('Root'),
			node2 = await basicTree.findNode(
				'2b547550-b874-4228-9395-a4fb00f31245',
				'id',
			);

		assert.deepEqual(root, node);
		assert.isOk(node2);
	});

	test('search public API returns matches and supports provided results array', async () => {
		const root = (await basicTree.getNodeByPathLocator('1'))!;
		const exactResults = await basicTree.search(root, 'Root', {
			propertyName: 'name',
			exact: true,
		});
		assert.isAbove(exactResults.length, 0);

		const providedResults: Node[] = [];
		const fuzzyResults = await basicTree.search(
			root,
			'Node',
			{
				propertyName: 'name',
				exact: false,
			},
			providedResults,
		);
		assert.strictEqual(fuzzyResults, providedResults);
		assert.isAbove(fuzzyResults.length, 0);
	});

	test('getNodeByPathLocator', async () => {
		const node3 = await basicTree.getNodeByPathLocator('1.2.3');

		assert.isOk(node3);
		assert.equal(await basicTree.getNodeByPathLocator(), basicTree._roots);
	});

	test('getPathNodes', async () => {
		const nodes3 = (await basicTree.getPathNodes('1.2.3'))!,
			node3 = (await basicTree.getNodeByPathLocator('1.2.3'))!,
			nodes301 = (await basicTree.getPathNodes('1.2.3.301'))!,
			nodes3X1 = (await basicTree.getPathNodes('1.2.33'))!,
			nodes3X2 = (await basicTree.getPathNodes('1.2.3.3'))!,
			nodes3X3 = (await basicTree.getPathNodes('0.1.2.3'))!;

		assert.isOk(nodes3);
		assert.isOk(nodes301);

		assert.equal(nodes3X1.indexOf(undefined), 2);
		assert.equal(
			nodes3X2.filter((n) => {
				return n;
			}).length,
			3,
		);

		assert.equal(nodes3.length, 3);
		assert.equal(nodes301.length, 4);

		assert.deepEqual(nodes3.slice().pop(), node3);
		assert.equal(nodes3X3.length, nodes3.length);
		assert.deepEqual(nodes3X3.slice().pop(), nodes3.slice().pop());
		assert.equal(await basicTree.getPathNodes(), basicTree._treeData);
	});

	test('getPathString', async () => {
		const node3 = await basicTree.getNodeByPathLocator('1.2.3'),
			pathString = await basicTree.getPathString(node3?.pathLocator);
		assert.equal(pathString?.split('/').pop(), node3?.name);
		assert.isUndefined(await basicTree.getPathString());
		const node301 = await basicTree.getNodeByPathLocator('1.2.3.301'),
			node301PathString = await basicTree.getPathString(
				node301?.pathLocator,
				'name',
				'/',
			);
		assert.equal(node301PathString, 'Root/Node2/Node3/Node301');
	});

	test('getPathStringByProperty', async () => {
		const node3 = await basicTree.getNodeByPathLocator('1.2.3'),
			pathString = await basicTree.getPathStringByProperty(node3!.id, 'id');
		assert.equal(pathString!.split('/').pop(), node3!.name);
		assert.isUndefined(await basicTree.getPathStringByProperty());
		assert.equal(
			await basicTree.getPathStringByProperty('1.2.3', 'pathLocator'),
			await basicTree.getPathString('1.2.3'),
		);
	});

	test('hasChildren', async () => {
		const node3 = await basicTree.getNodeByPathLocator('1.2.3'),
			node301 = await basicTree.getNodeByPathLocator('1.2.3.301');

		assert(await basicTree.hasChildren(node3));
		assert(!(await basicTree.hasChildren(node301)));
		assert.isFalse(await basicTree.hasChildren());
	});

	test('getProperty', async () => {
		const rootNode = await basicTree.getNodeByPathLocator('1');

		assert.equal(await basicTree.getProperty(rootNode, 'name'), 'Root');
		assert.equal(await basicTree.getProperty(rootNode), undefined);
		assert.equal(await basicTree.getProperty(null, 'name'), undefined);
	});
});

suite('basicPL', () => {
	let basicTree: Tree;

	suiteSetup(async () => {
		basicTree = await treeFromJsonUrl(basicTreePlUrl);
	});

	test('instantiating a Cosmoz.Tree', () => {
		assert.isOk(basicTree);
	});

	test('findNode', async () => {
		const node1 = (
				await basicTree.searchNodes(
					'1.2.3',
					undefined,
					undefined,
					'pathLocator',
				)
			)[0],
			node2 = await basicTree.findNode('1.2.3', 'pathLocator'),
			node3 = await basicTree.findNode(
				'3a7654f1-e3e6-49c7-b6a8-a4fb00f31245',
				'id',
			);
		assert.equal(node1.id, '3a7654f1-e3e6-49c7-b6a8-a4fb00f31245');
		assert.equal(node2!.id, '3a7654f1-e3e6-49c7-b6a8-a4fb00f31245');
		assert.equal(node3!.pathLocator, '1.2.3');
	});
});

suite('multiRoot', () => {
	let multiRootTree: Tree;

	suiteSetup(async () => {
		multiRootTree = await treeFromJsonUrl(multiRootTreeUrl);
	});

	test('instantiating a Cosmoz.Tree', () => {
		assert.isOk(multiRootTree);
	});

	test('getNodeByProperty', async () => {
		const node2 = await multiRootTree.getNodeByProperty(
				'167d1485-7d4f-4c7d-86cd-a4fb00f31245',
				'id',
			),
			node3 = await multiRootTree.getNodeByProperty(
				'3a7654f1-e3e6-49c7-b6a8-a4fb00f31245',
				'id',
			),
			node4 = await multiRootTree.getNodeByProperty(
				'2b547550-b874-4228-9395-a4fb00f31245',
				'id',
			);
		assert.isOk(node2);
		assert.isOk(node3);
		assert.isOk(node4);
	});

	test('getPathNodes', async () => {
		const nodes3 = (await multiRootTree.getPathNodes('1.2.3'))!,
			node3 = (await multiRootTree.getNodeByPathLocator('1.2.3'))!,
			nodes14 = (await multiRootTree.getPathNodes('1.4'))!,
			nodes3X1 = (await multiRootTree.getPathNodes('1.2.33'))!,
			nodes3X2 = (await multiRootTree.getPathNodes('1.2.3.3'))!,
			nodes3X3 = (await multiRootTree.getPathNodes('0.1.2.3'))!;

		assert.equal(nodes3X1.indexOf(undefined), 1);
		assert.equal(
			nodes3X2.filter((n) => {
				return n;
			}).length,
			2,
		);
		assert.isAbove(nodes3.length, 0);
		assert.isAbove(nodes14.length, 0);

		assert.equal(nodes3.length, 2);
		assert.equal(nodes14.length, 1);

		assert.deepEqual(nodes3.slice().pop(), node3);
		assert.equal(nodes3X3.length, nodes3.length);
		assert.deepEqual(nodes3X3.slice().pop(), nodes3.slice().pop());
	});
});

suite('missingAncestor', () => {
	let missingAncestorTree: Tree;

	suiteSetup(async () => {
		missingAncestorTree = await treeFromJsonUrl(missingAncestorTreeUrl);
	});

	test('instantiating a Cosmoz.Tree', () => {
		assert.isOk(missingAncestorTree);
	});

	test('getNodeByProperty', async () => {
		const node2 = await missingAncestorTree.getNodeByProperty(
				'167d1485-7d4f-4c7d-86cd-a4fb00f31245',
				'id',
			),
			node301 = await missingAncestorTree.getNodeByProperty(
				'3a7654f1-e3e6-49c7-b6a8-a4fb00f31245',
				'id',
			),
			node401 = await missingAncestorTree.getNodeByProperty(
				'865065da-f44c-472e-a8df-a4fb00f3124b',
				'id',
			);
		assert.isOk(node2);
		assert.isOk(node301);
		assert.isOk(node401);
	});

	/* eslint-disable camelcase */
	test('getPathNodes', async () => {
		const node301 = (await missingAncestorTree.getNodeByProperty(
				'3a7654f1-e3e6-49c7-b6a8-a4fb00f31245',
				'id',
			))!,
			node401 = (await missingAncestorTree.getNodeByProperty(
				'865065da-f44c-472e-a8df-a4fb00f3124b',
				'id',
			))!,
			node301Path = (await missingAncestorTree.getPathNodes(
				node301!.pathLocator,
			))!,
			node401Path = (await missingAncestorTree.getPathNodes(
				node401!.pathLocator,
			))!,
			n_1_2_3_301 = (await missingAncestorTree.getPathNodes('1.2.3.301'))!,
			n_1_2_301 = (await missingAncestorTree.getPathNodes('1.2.301'))!,
			n_1_2 = (await missingAncestorTree.getPathNodes('1.2'))!,
			n_1_2_2 = (await missingAncestorTree.getPathNodes('1.2.2'))!,
			n_1_4_4 = (await missingAncestorTree.getPathNodes('1.4.4'))!,
			n_1_2_7_8 = (await missingAncestorTree.getPathNodes('1.2.7.8'))!,
			//n_1_2_7_301 = await missingAncestorTree.getPathNodes('1.2.7.301'),
			n_2_301 = (await missingAncestorTree.getPathNodes('2.301'))!,
			n_601_301 = (await missingAncestorTree.getPathNodes('601.301.10.11'))!;

		// since 301 is its own root, it should be the only node returned
		assert.equal(node301Path.length, 1);
		assert.equal(node301!.name, 'Node301');
		assert.deepEqual(node301Path[0], node301);

		// node401 is directly under 301, should only be two nodes returned
		assert.equal(node401Path.length, 2);
		assert.equal(node401Path[0], node301);
		assert.equal(node401Path[1], node401);

		// 1.2.3.301
		assert.equal(n_1_2_3_301[0]!.name, 'Node301');

		// 1.2.301
		// make sure we don't get stuck in the first root
		assert.equal(n_1_2_301[0]!.name, 'Node301');
		assert.equal(n_1_2_301.length, 1);

		// 1.2
		assert.equal(n_1_2.length, 2);
		assert.equal(n_1_2[0]!.name, 'Node1');
		assert.equal(n_1_2[1]!.name, 'Node2');

		// 1.2.2
		// make sure we don't pick the same node twice at the end
		assert.equal(n_1_2_2.length, 3);
		assert.equal(n_1_2_2[0]!.name, 'Node1');
		assert.equal(n_1_2_2[1]!.name, 'Node2');
		assert.isNotOk(n_1_2_2[2]);

		// 1.4.4
		// make sure we handle nodes without 'children' property
		assert.equal(n_1_4_4.length, 3);
		assert.equal(n_1_4_4[0]!.name, 'Node1');
		assert.equal(n_1_4_4[1]!.name, 'Nochildren');
		assert.isNotOk(n_1_4_4[2]);

		// 1.2.7.8
		// make sure we handle multiple undefineds at the end
		assert.equal(n_1_2_7_8.length, 4);
		assert.equal(n_1_2_7_8[0]!.name, 'Node1');
		assert.equal(n_1_2_7_8[1]!.name, 'Node2');
		assert.isNotOk(n_1_2_7_8[2]);
		assert.isNotOk(n_1_2_7_8[3]);

		// 601.301.10.11
		// same amount of undefined values: make sure the match with more defined values
		// is in favor
		assert.equal(n_601_301.length, 4);
		assert.equal(
			n_601_301.filter((n) => {
				return n;
			}).length,
			2,
		);

		// 1.2.7.301 - impossible case ?
		// assert.equal(n_1_2_7_301.length, 4);
		// assert.equal(n_1_2_7_301[0].name, 'Node1');
		// assert.equal(n_1_2_7_301[1].name, 'Node2');
		// assert.isNotOk(n_1_2_7_301[2]);
		// assert.isNotOk(n_1_2_7_301[3]);

		// 2.301
		assert.equal(n_2_301.length, 1);
		assert.equal(n_2_301[0]!.name, 'Node301');
	});
	/* eslint-enable camelcase */
});

suite('basicWithOptions', () => {
	let basicTreeWithOptions: Tree;

	suiteSetup(async () => {
		basicTreeWithOptions = await treeFromJsonUrl(basicTreeUrl, {
			// set the childProperty to something that doesn't exist in the tree
			childProperty: 'noChildren',
		});
	});

	test('instantiating a Cosmoz.Tree', () => {
		assert.isOk(basicTreeWithOptions);
	});

	test('hasChildren is false when the childProperty doesnt exist', async () => {
		const rootNode = await basicTreeWithOptions.getNodeByPathLocator('1');

		assert.isFalse(await basicTreeWithOptions.hasChildren(rootNode));
	});

	test('nodeConformsSearch returns undefined when theres no property', async () => {
		const rootNode = await basicTreeWithOptions.getNodeByPathLocator('1');

		assert.isUndefined(
			await basicTreeWithOptions.nodeConformsSearch(rootNode!, 'Root'),
		);
		assert.isUndefined(
			await basicTreeWithOptions.nodeConformsSearch(rootNode!, 'Root', {
				propertyName: 'noProperty',
			}),
		);
	});
});
