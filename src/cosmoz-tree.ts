/**
Navigator through object with treelike datastructure and default settings.

@demo demo/index.html
*/

export interface Options {
	childProperty?: string;
	searchProperty?: string;
	pathLocatorSeparator?: string;
	pathStringSeparator?: string;
}

export interface Node {
	id: string;
	pathLocator: string;
	path?: string;
	name?: string;
	children?: Record<string, Node>;
}

export type TreeData = Record<string, Node>;

const _sortPathNodes = (a: (Node | undefined)[], b: (Node | undefined)[]) => {
	const undefCounter = <Type>(item: Type) => item === undefined,
		defCounter = <Type>(item: Type) => item,
		aUndefCount = a.filter(undefCounter).length,
		bUndefCount = b.filter(undefCounter).length,
		aDefCount = a.filter(defCounter).length,
		bDefCount = b.filter(defCounter).length;

	if (aUndefCount < bUndefCount) {
		return -1;
	}

	if (aUndefCount > bUndefCount || aDefCount < bDefCount) {
		return 1;
	}

	if (aDefCount > bDefCount) {
		return -1;
	}

	return 0;
};

export class Tree {
	_treeData: TreeData;

	_roots: Node[];

	childProperty: string;

	searchProperty: string;

	pathLocatorSeparator: string;

	pathStringSeparator: string;

	_nodeById: Map<string, Node>;

	/**
	 * @param {Object} treeData (The tree object.)
	 * @param {Object} options (Tree options.)
	 * @param {String} options.childProperty ["children"] (The name of the property a search should be based on. e.g. "name")
	 * @param {String} options.propertyName ["name"] (The name of the property a search should be based on. e.g. "name")
	 * @param {String} options.pathStringSeparator ["/"] (The string the path should get separated with.)
	 * @param {String} options.pathLocatorSeparator ["."] (The string which separates the path segments of a path locator.)
	 */
	constructor(treeData: TreeData, options: Options = {}) {
		this._treeData = treeData;
		this._roots = Object.values(treeData);
		this._nodeById = new Map();

		this.pathLocatorSeparator = options.pathLocatorSeparator || '.';
		this.pathStringSeparator = options.pathStringSeparator || '/';
		this.childProperty = options.childProperty || 'children';
		this.searchProperty = options.searchProperty || 'name';
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Object} - The first found node.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {String} propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Array} nodes [this._roots] (The objects the search should be based on.)
	 */
	getNodeByProperty(
		propertyValue?: string,
		propertyName: string = this.searchProperty,
		nodes: Node[] = this._roots,
	) {
		if (propertyValue === undefined) {
			return;
		}

		if (propertyName === 'id' && nodes === this._roots) {
			return this._getNodeById(propertyValue);
		}

		return this.findNode(propertyValue, propertyName, nodes);
	}

	private _getNodeById(id: string) {
		const cached = this._nodeById.get(id);
		if (cached) {
			return cached;
		}

		const stack = this._roots.slice().reverse();

		while (stack.length > 0) {
			const node = stack.pop();
			if (!node) {
				continue;
			}

			this._cacheNodeId(node);

			if (node.id === id) {
				return node;
			}

			const children = this.getChildren(node);
			for (let i = children.length - 1; i >= 0; i -= 1) {
				stack.push(children[i]);
			}
		}

		return undefined;
	}

	private _cacheNodeId(node: Node) {
		if (!this._nodeById.has(node.id)) {
			this._nodeById.set(node.id, node);
		}
	}

	private _normalizeValue(value: string) {
		return value
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toUpperCase();
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Array} - All found nodes.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} nodes [this._treeData] (The nodes the search should be based on.)
	 * @param {Boolean} exact [true] (If the search should be executed exact or flaw. true wouldn't match "Pet")
	 * @param {String} propertyName [this.searchProperty] (The name of the property the match should be based on. e.g. "name")
	 */
	searchNodes(
		propertyValue?: string,
		nodes?: Node[],
		exact?: boolean,
		propertyName: string = this.searchProperty,
	) {
		const options = {
			propertyName,
			exact: exact !== undefined ? exact : true,
			firstHitOnly: false,
		};

		return this._searchNodes(propertyValue, options, nodes);
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Object} - The first found node.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {String} propertyName [this.searchProperty] (The name of the property the match should be based on. e.g. "name")
	 * @param {Object} nodes [this._treeData] (The nodes the search should be based on.)
	 */
	findNode(
		propertyValue: string,
		propertyName: string = this.searchProperty,
		nodes?: Node[],
	) {
		const options = {
			propertyName,
			exact: true,
			firstHitOnly: true,
		};

		return this._searchNodes(propertyValue, options, nodes).shift();
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Array} - The found node(s).
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} options (Matching options)
	 * @param {String} options.propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Boolean} options.exact [false] (If the search should be executed exact or fuzzy. true wouldn't match "Pet")
	 * @param {Boolean} options.firstHitOnly [false] (If the search should only return the first found node.)
	 * @param {Object} nodes [this._roots] (The nodes the search should be based on.)
	 */
	private _searchNodes(
		propertyValue: string | undefined,
		options: {
			propertyName: string;
			exact: boolean;
			firstHitOnly: boolean;
		},
		nodes = this._roots,
	) {
		const results = [];
		const stack = nodes.slice().reverse();
		const normalizedSearchValue =
			!options.exact && propertyValue !== undefined
				? this._normalizeValue(propertyValue)
				: undefined;

		while (stack.length > 0) {
			const node = stack.pop();
			if (!node) {
				continue;
			}

			const nodeConforms = this.nodeConformsSearch(node, propertyValue, {
				...options,
				normalizedSearchValue,
			});

			if (nodeConforms) {
				results.push(node);
				if (options.firstHitOnly) {
					return results;
				}
			}

			const children = this.getChildren(node);
			for (let i = children.length - 1; i >= 0; i -= 1) {
				stack.push(children[i]);
			}
		}

		return results;
	}

	/**
	 * Returns the node of a given path.
	 * @returns {Object} The node object
	 * @param {String} pathLocator (The string which describes the path. e.g. "1.2.9")
	 * @param {Object} nodeObj [this._treeData] (The object the search should be based on.)
	 * @param {String} pathLocatorSeparator [this.pathLocatorSeparator] (The string which separates the path. e.g ".")
	 */
	getNodeByPathLocator(
		pathLocator: undefined,
		nodeObj?: TreeData,
		pathLocatorSeparator?: string,
	): Node[];
	getNodeByPathLocator(
		pathLocator: string,
		nodeObj?: TreeData,
		pathLocatorSeparator?: string,
	): Node | undefined;
	getNodeByPathLocator(
		pathLocator?: string,
		nodeObj?: TreeData,
		pathLocatorSeparator?: string,
	): Node[] | Node | undefined;
	getNodeByPathLocator(
		pathLocator?: string,
		nodeObj: TreeData = this._treeData,
		pathLocatorSeparator: string = this.pathLocatorSeparator,
	): Node[] | Node | undefined {
		if (!pathLocator) {
			return this._roots;
		}

		const pathNodes = this.getPathNodes(
			pathLocator,
			nodeObj,
			pathLocatorSeparator,
		);

		return pathNodes?.pop();
	}

	/**
	 * Returns the nodes on a given path.
	 * A valid path 1.2.3 should return the items [1, 2, 3]
	 * - path 1.2.3.3 should return [1, 2, 3, undefined]
	 * - path 0.1.2.3 should return [1, 2, 3]
	 * - path 0.1.5.3 should return [1, undefined, undefined]
	 * @returns {Array} The node array
	 * @param {String} pathLocator (The string which describes the path. e.g. "1.2.9")
	 * @param {Object} nodeObj [this._treeData] (The object the search should be based on.)
	 * @param {String} pathLocatorSeparator [this.pathLocatorSeparator] (The string which separates the path.)
	 */
	getPathNodes(
		pathLocator: undefined,
		nodeObj?: TreeData,
		pathLocatorSeparator?: string,
	): TreeData;
	getPathNodes(
		pathLocator: string,
		nodeObj?: TreeData,
		pathLocatorSeparator?: string,
	): (Node | undefined)[] | undefined;
	getPathNodes(
		pathLocator?: string,
		nodeObj?: TreeData,
		pathLocatorSeparator?: string,
	): TreeData | (Node | undefined)[] | undefined;
	getPathNodes(
		pathLocator?: string,
		nodeObj: TreeData = this._treeData,
		pathLocatorSeparator: string = this.pathLocatorSeparator,
	): TreeData | (Node | undefined)[] | undefined {
		if (!pathLocator) {
			return nodeObj;
		}

		return Object.keys(nodeObj)
			.map((key) => {
				const subTree: TreeData = {};
				subTree[key] = nodeObj[key];
				const pathNodes = this._getPathNodes(
					pathLocator,
					subTree,
					pathLocatorSeparator,
				);

				return pathNodes;
			})
			.filter((item) => {
				return item && item.length > 0;
			})
			.sort(_sortPathNodes)[0];
	}

	private _getPathNodes(
		pathLocator: string,
		nodeObj: TreeData = this._treeData,
		pathLocatorSeparator: string = this.pathLocatorSeparator,
	) {
		const path = pathLocator.split(pathLocatorSeparator),
			nodes = this._pathToNodes(path, nodeObj, pathLocatorSeparator);

		// Filter out undefined items of the start
		while (nodes.length > 0 && nodes[0] === undefined) {
			nodes.shift();
		}

		return nodes;
	}

	private _pathToNodes(path: string[], nodes: TreeData, separator: string) {
		let pathSegment = nodes;
		return path.map((nodeKey: string, i: number) => {
			// Get the nodes on the path
			if (!pathSegment) {
				return undefined;
			}

			const node =
				pathSegment[nodeKey] ??
				pathSegment[path.slice(0, i + 1).join(separator)];
			if (node) {
				pathSegment = node[this.childProperty as 'children']!;
			}
			return node;
		});
	}

	/**
	 * Returns a string which describes the path of a node (found by its path locator).
	 * @returns {String} e.g. home/computer/desktop
	 * @param {String} pathLocator (The string which describes the path. e.g. "1.2.9")
	 * @param {String} pathProperty (The property of a node on which the path should be build on. e.g "location" with node = {"location": "home", ..})
	 * @param {String} pathStringSeparator [this.pathStringSeparator] (The string the path should get separated with.)
	 * @param {String} pathLocatorSeparator [this.pathLocatorSeparator] (The string which separates the path segments of pathLocator.)
	 */
	getPathString(
		pathLocator?: string,
		pathProperty: string = this.searchProperty,
		pathStringSeparator: string = this.pathStringSeparator,
		pathLocatorSeparator: string = this.pathLocatorSeparator,
	) {
		const pathNodes = this.getPathNodes(
			pathLocator,
			this._treeData,
			pathLocatorSeparator,
		);

		if (!Array.isArray(pathNodes)) {
			return;
		}

		return pathNodes
			.filter((node) => node != null)
			.map((node) => node![pathProperty as 'pathLocator'])
			.join(pathStringSeparator);
	}

	/**
	 * Returns a string which describes the path of a node (found by a node's property and value).
	 * @returns {String} e.g. home/computer/desktop
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {String} propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {String} pathProperty (The property of a node on which the path should be build on. e.g "location" if node = {"location": "home"})
	 * @param {String} pathStringSeparator [this.pathStringSeparator] (The string the path should get separated with.)
	 * @param {String} pathLocatorSeparator [this.pathLocatorSeparator] (The string which separates the path. e.g ".")
	 */
	getPathStringByProperty(
		propertyValue?: string,
		propertyName: string = this.searchProperty,
		pathProperty: string = this.searchProperty,
		pathStringSeparator: string = this.pathStringSeparator,
		pathLocatorSeparator: string = this.pathLocatorSeparator,
	) {
		if (propertyValue === undefined) {
			return;
		}

		if (propertyName === 'pathLocator') {
			return this.getPathString(
				propertyValue,
				pathProperty,
				pathStringSeparator,
				pathLocatorSeparator,
			);
		}

		const node = this.getNodeByProperty(propertyValue, propertyName);

		if (node) {
			const path = node.pathLocator || node.path;
			return this.getPathString(
				path,
				pathProperty,
				pathStringSeparator,
				pathLocatorSeparator,
			);
		}
	}

	/**
	 * Returns an Object or an Array representing the children of a node.
	 * @param {Object} node The object to return children from
	 * @returns {Object|Array} The node's children
	 */
	getChildren(node: Node) {
		if (!node || !node[this.childProperty as 'children']) {
			return [];
		}

		return Object.values(node[this.childProperty as 'children']!);
	}

	/**
	 * Returns true if a node has children.
	 * @param {Object} node The object to get children from
	 * @returns {Boolean} True if node has children
	 */
	hasChildren(node?: Node) {
		if (!node) {
			return false;
		}
		const childMap = node[this.childProperty as 'children'];
		if (!childMap) {
			return false;
		}
		// eslint-disable-next-line guard-for-in
		for (const key in childMap) {
			return true;
		}
		return false;
	}

	/**
	 * Returns the property of a Node based on a given property name.
	 * @param {Object} node The object to get property from
	 * @param {String} propertyName The name of property
	 * @returns {*} The value of the property
	 */
	getProperty(node?: Node | null, propertyName?: string) {
		if (!node || !propertyName) {
			return;
		}

		return node[propertyName as keyof typeof node];
	}

	/**
	 * Checks if a node matches the search criteria.
	 * @returns {Boolean} True if node matches
	 * @param {node} node (The node the check should be based on.)
	 * @param {String} searchValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} options (Comparison options)
	 * @param {String} options.propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Boolean} options.exact [false] (If the search should be executed exact or fuzzy. true wouldn't match "Pet")
	 * @param {String} [options.normalizedSearchValue] @internal Pre-computed normalized search value for internal use only.
	 */
	nodeConformsSearch(
		node: Node,
		searchValue: string | undefined,
		options?: {
			propertyName: string;
			exact?: boolean;
			normalizedSearchValue?: string;
		},
	) {
		const property = (options
			? node[options.propertyName as keyof typeof node]
			: undefined) as unknown as string;

		if (!property) {
			// eslint-disable-next-line no-console
			console.error('options.propertyName needs to be specified.');
			return;
		}

		if (options?.exact) {
			return property === searchValue;
		}

		if (searchValue === undefined) {
			return false;
		}

		const normalizedPropertyValue = this._normalizeValue(property);
		const comparableSearchValue =
			options?.normalizedSearchValue || this._normalizeValue(searchValue);

		return normalizedPropertyValue.indexOf(comparableSearchValue) > -1;
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Array} The nodes found
	 * @param {node} node	 The node to search in.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} options (Search options)
	 * @param {String} options.propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Boolean} options.exact [false] (If false, the propertyValue is matched fuzzy)
	 * @param {Array} results (The array search results get added to.) Default: []
	 */
	search(
		node: Node,
		propertyValue: string | undefined,
		options: {
			propertyName: string;
			exact?: boolean;
		},
		results: Node[] = [],
	): Node[] {
		const normalizedSearchValue =
			!options.exact && propertyValue !== undefined
				? this._normalizeValue(propertyValue)
				: undefined;
		const stack = [node];

		while (stack.length > 0) {
			const currentNode = stack.pop();
			if (!currentNode) {
				continue;
			}

			const nodeConforms = this.nodeConformsSearch(currentNode, propertyValue, {
				...options,
				normalizedSearchValue,
			});

			if (nodeConforms) {
				results.push(currentNode);
			}

			const children = this.getChildren(currentNode);
			for (let i = children.length - 1; i >= 0; i -= 1) {
				stack.push(children[i]);
			}
		}

		return results;
	}
}
