/**
 * Navigator through object with treelike datastructure.
 */
class CosmozTree {
	constructor() {
		// Abstract
	}

	/**
	 * Should return the first node found.
	 * @returns {Object} The first found node
	 * @param {String} propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Boolean} exact (If the search should be executed exact or flaw. true wouldn't match "Pet")
	 * @param {Object} nodeObj (The object the search should be based on.) or on default this._treeData
	 */
	getNodeByProperty(propertyName, propertyValue, exact, nodeObj) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Should return the nodes on a given path.
	 * @returns {Array} The node found
	 * @param {String} pathLocator (The string which describes the path. e.g. "1.2.9")
	 * @param {Object} nodeObj (The object the search should be based on.) Default: this._treeData
	 * @param {String} separatorSign (The string which separates the path. e.g ".") Default: "."
	*/
	getPathNodes(pathLocator, nodeObj, separatorSign) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Returns a string which describes the path of a node (found by its path locator).
	 * @returns {String} e.g. home/computer/desktop
	 * @param {String} pathLocator (The string which describes the path. e.g. "1.2.9")
	 * @param {String} pathProperty (The property of a node on which the path should be build on. e.g "location" if node = {"location": "home"})
	 * @param {String} pathSeparator (The string the path should get separated with.)
	 * @param {String} separatorSign (The string which separates the path. e.g ".")
	*/
	getPathString(pathLocator, pathProperty, pathSeparator, separatorSign) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Should returns a string which describes the path of a node (found by a node's property and value).
	 * @returns {String} e.g. home/computer/desktop
	 * @param {String} propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {String} pathProperty (The property of a node on which the path should be build on. e.g "location" if node = {"location": "home"})
	 * @param {String} pathSeparator (The string the path should get separated with.)
	 * @param {String} separatorSign (The string which separates the path. e.g ".")
	*/
	getPathStringByProperty(propertyName, propertyValue, pathProperty, pathSeparator, separatorSign) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Should return the children of a node in form of an array.
	 * @returns {Array} The node's children
	 * @param {node} node (The node of which the children should be returned of.)
	*/
	getChildren(node) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Returns true if a node has children.
	 * @returns {Boolean} True if node has children
	 * @param {node} node (The node of which the children check should be applied on.)
	*/
	hasChildren(node) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Should return the value of a node's property.
	 * @returns {Array|Object|String} The value of the property
	 * @param {node} node (The node of which the property value should be returned of.)
	 * @param {String} propertyName (The name of the property. e.g. "name")
	*/
	getProperty(node, propertyName) { // eslint-disable-line no-unused-vars
		throw new Error('Must be implemented in derived object');
	}

	/**
	 * Checks if a node matches the search criteria.
	 * @returns {Boolean} True if node matches
	 * @param {node} node (The node the check should be based on.)
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} options (Comparison options)
	 * @param {String} options.propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Boolean} options.exact [false] (If the search should be executed exact or fuzzy. true wouldn't match "Pet")
	*/
	nodeConformsSearch(node, propertyValue, options) {
		const property = options ? node[options.propertyName] : undefined;

		if (!property) {
			console.error('options.propertyName needs to be specified.');
			return;
		}

		if (options.exact) {
			return property === propertyValue;
		}
		return property.toLowerCase().indexOf(propertyValue.toLowerCase()) > -1;
	}

	/**
	 * Searches a (multi root) node and matches nodes based on a property and a value.
	 * @returns {Array} The nodes found
	 * @param {node} node  The node to search in.
	 * @param {String} propertyValue (The value of the property the match should be based on. e.g. "Peter")
	 * @param {Object} options (Search options)
	 * @param {String} options.propertyName (The name of the property the match should be based on. e.g. "name")
	 * @param {Boolean} options.exact [false] (If false, the propertyValue is matched fuzzy)
	 * @param {Array} results (The array search results get added to.) Default: []
	*/
	search(node, propertyValue, options, results = []) {
		const nodeConforms = this.nodeConformsSearch(node, propertyValue, options),
			children = this.getChildren(node);

		if (nodeConforms) {
			results.push(node);
		}

		if (Array.isArray(children)) {
			for (let i = 0; i < children.length; i++) {
				const result = this.search(children[i], propertyValue, options, results);
				if (!Array.isArray(result)) {
					return [result];
				}
			}
		}

		return results;
	}
}

window.Cosmoz = window.Cosmoz || {};
Cosmoz.Tree = CosmozTree;