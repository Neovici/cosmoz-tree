import { Tree } from '../src/cosmoz-tree';

export const treeBaseUrl = '/test/data';

export const treeFromJsonUrl = async (url: string, options = {}) => {
    const json = await fetch(url).then((r) => r.json());

    return new Tree(json, options);
};