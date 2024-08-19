import { treeBaseUrl, treeFromJsonUrl } from './base-data';
import { Tree } from '../src/cosmoz-tree';
import { assert } from '@open-wc/testing';

const diacriticsTreeUrl = `${treeBaseUrl}/diacriticsTree.json`;

suite('diacritics', () => {
	let diacriticsTree: Tree;

	suiteSetup(async () => {
		diacriticsTree = await treeFromJsonUrl(diacriticsTreeUrl);
	});

    /**
     * A pair of [value, exactMatches, nonExactMatches]
     */
    const valuesToCheck = [
        ['Peter', 0, 2],
        ['Péter', 1, 2],
        ['Pétér', 1, 2],
        ['Michael', 0, 1],
        ['Michaél', 1, 1]
    ] as const;

    valuesToCheck.forEach(([value, exactMatches, nonExactMatches]) => {
        test(`should matter when doing an exact search (${value})`, () => {
            const results = diacriticsTree.searchNodes(value, undefined, true, 'name');
            
                assert.equal(results.length, exactMatches);
        });
    
        test(`should NOT matter when doing a non-exact search (${value})`, () => {
            const results = diacriticsTree.searchNodes(value, undefined, false, 'name');
            assert.equal(results.length, nonExactMatches);
        });
    })
});