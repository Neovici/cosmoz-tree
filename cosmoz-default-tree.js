import { Tree } from './cosmoz-tree.js';

/**
Navigator through object with treelike datastructure and default settings.

@demo demo/index.html
*/
export class DefaultTree extends Tree {

	/**
	 * @param {Object} treeData (The tree object.)
	 * @param {Object} options (Tree options.)
	 * @param {String} options.childProperty ["children"] (The name of the property a search should be based on. e.g. "name")
	 * @param {String} options.propertyName ["name"] (The name of the property a search should be based on. e.g. "name")
	 * @param {String} options.pathStringSeparator ["/"] (The string the path should get separated with.)
	 * @param {String} options.pathLocatorSeparator ["."] (The string which separates the path segments of a path locator.)
	*/
	constructor(treeData, options = {}) {
		super();
		this._treeData = treeData;
		this._roots = Object.values(treeData);

		this.pathLocatorSeparator = options.pathLocatorSeparator || '.';
		this.pathStringSeparator = options.pathStringSeparator || '/';
		this.childProperty = options.childProperty || 'children';
		this.searchProperty = options.searchProperty || 'name';
	}

	static _sortPathNodes(a, b) {
		const undefCounter = item => item === undefined,
			defCounter = item => item,
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
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Object} - The first found node.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {String} propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Array} nodes [this._roots] (The objects the search should be based on.)
	 */
	getNodeByProperty(propertyValue, propertyName = this.searchProperty, nodes = this._roots) {
		if (propertyValue === undefined) {
			return;
		}

		return this.findNode(propertyValue, propertyName, nodes);
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Array} - All found nodes.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} nodes [this._treeData] (The nodes the search should be based on.)
	 * @param {Boolean} exact [true] (If the search should be executed exact or flaw. true wouldn't match "Pet")
	 * @param {String} propertyName [this.searchProperty] (The name of the property the match should be based on. e.g. "name")
	*/
	searchNodes(propertyValue, nodes, exact, propertyName = this.searchProperty) {
		const options = {
			propertyName,
			exact: exact !== undefined ? exact : true,
			firstHitOnly: false
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
	findNode(propertyValue, propertyName = this.searchProperty, nodes) {
		const options = {
			propertyName,
			exact: true,
			firstHitOnly: true
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
	_searchNodes(propertyValue, options, nodes = this._roots) {
		let results = [];

		nodes.some(node => {
			results = results.concat(this.search(node, propertyValue, options));
			return options.firstHitOnly && results.length > 0;
		});

		return results;
	}

	/**
	 * Returns the node of a given path.
	 * @returns {Object} The node object
	 * @param {String} pathLocator (The string which describes the path. e.g. "1.2.9")
	 * @param {Object} nodeObj [this._treeData] (The object the search should be based on.)
	 * @param {String} pathLocatorSeparator [this.pathLocatorSeparator] (The string which separates the path. e.g ".")
	*/
	getNodeByPathLocator(pathLocator, nodeObj = this._treeData, pathLocatorSeparator = this.pathLocatorSeparator) {
		if (!pathLocator) {
			return this._roots;
		}

		const pathNodes = this.getPathNodes(pathLocator, nodeObj, pathLocatorSeparator);
		return pathNodes && pathNodes.pop();
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
	getPathNodes(pathLocator, nodeObj = this._treeData, pathLocatorSeparator = this.pathLocatorSeparator) {
		if (!pathLocator) {
			return nodeObj;
		}

		return Object.keys(nodeObj)
			.map(key => {
				const subTree = {};
				subTree[key] = nodeObj[key];
				return this._getPathNodes(pathLocator, subTree, pathLocatorSeparator);
			})
			.filter(item => {
				return item && item.length > 0;
			})
			.sort(this.constructor._sortPathNodes)[0];
	}

	_getPathNodes(pathLocator, nodeObj = this._treeData, pathLocatorSeparator = this.pathLocatorSeparator) {
		const path = pathLocator.split(pathLocatorSeparator),
			nodes = this._pathToNodes(path, nodeObj);

		// Filter out undefined items of the start
		while (nodes.length > 0 && nodes[0] === undefined) {
			nodes.shift();
		}

		return nodes;
	}

	_pathToNodes(path, nodes) {
		let pathSegment = nodes;
		return path.map(nodeKey => {
			// Get the nodes on the path
			if (!pathSegment) {
				return false;
			}
			const node = pathSegment[nodeKey];
			if (node) {
				pathSegment = node[this.childProperty];
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
		pathLocator,
		pathProperty = this.searchProperty,
		pathStringSeparator = this.pathStringSeparator,
		pathLocatorSeparator = this.pathLocatorSeparator
	) {
		const pathNodes = this.getPathNodes(pathLocator, this._treeData, pathLocatorSeparator);

		if (!Array.isArray(pathNodes)) {
			return;
		}

		return pathNodes
			.filter(node => node != null)
			.map(node => node[pathProperty])
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
		propertyValue,
		propertyName = this.searchProperty,
		pathProperty = this.searchProperty,
		pathStringSeparator = this.pathStringSeparator,
		pathLocatorSeparator =	 this.pathLocatorSeparator
	) {
		if (propertyValue === undefined) {
			return;
		}

		if (propertyName === 'pathLocator') {
			return this.getPathString(propertyValue, pathProperty, pathStringSeparator, pathLocatorSeparator);
		}

		const node = this.getNodeByProperty(propertyValue, propertyName);

		if (node) {
			const path = node.pathLocator || node.path;
			return this.getPathString(path, pathProperty, pathStringSeparator);
		}
	}

	/**
	 * Returns an Object or an Array representing the children of a node.
	 * @param {Object} node The object to return children from
	 * @returns {Object|Array} The node's children
	 */
	getChildren(node) {
		if (!node || !node[this.childProperty]) {
			return [];
		}
		return Object.values(node[this.childProperty]);
	}

	/**
	 * Returns true if a node has children.
	 * @param {Object} node The object to get children from
	 * @returns {Boolean} True if node has children
	 */
	hasChildren(node) {
		if (!node) {
			return false;
		}
		const children = this.getChildren(node);
		return children && children.length > 0;
	}

	/**
	 * Returns the property of a Node based on a given property name.
	 * @param {Object} node The object to get property from
	 * @param {String} propertyName The name of property
	 * @returns {*} The value of the property
	 */
	getProperty(node, propertyName) {
		if (!node || !propertyName) {
			return;
		}
		return node[propertyName];
	}
}
