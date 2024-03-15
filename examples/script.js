import { Tree } from '../src/cosmoz-tree';

fetch('tree.json').then(async (response) => {
	const json = await response.json(),
		tree = new Tree(json),
		foundNode = tree.getNodeByProperty('Company Phqiglgqnn');

	// eslint-disable-next-line no-console
	console.log('Node found with property value', foundNode);
});

fetch('../test/data/missingAncestorTree.json').then(async (response) => {
	const json = await response.json(),
		tree = new Tree(json);

	// eslint-disable-next-line no-console
	console.log('Node found with path 1.2.301', tree.getPathNodes('1.2.301'));
});
