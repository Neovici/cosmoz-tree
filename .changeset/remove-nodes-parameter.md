---
'@neovici/cosmoz-tree': major
---

Remove the `nodes` / `nodeObj` parameters from the `Tree` API

All public methods now always operate on the tree's own roots. The following
parameters are gone:

- `searchNodes(propertyValue, nodes, exact, propertyName)` ->
  `searchNodes(propertyValue, exact, propertyName)`
- `findNode(propertyValue, propertyName, nodes)` ->
  `findNode(propertyValue, propertyName)`
- `getNodeByProperty(propertyValue, propertyName, nodes)` ->
  `getNodeByProperty(propertyValue, propertyName)`
- `getNodeByPathLocator(pathLocator, nodeObj, pathLocatorSeparator)` ->
  `getNodeByPathLocator(pathLocator, pathLocatorSeparator)`
- `getPathNodes(pathLocator, nodeObj, pathLocatorSeparator)` ->
  `getPathNodes(pathLocator, pathLocatorSeparator)`

Because these were positional arguments, call sites that passed them must also
drop the argument, otherwise the remaining arguments shift into the wrong
parameters. Callers that passed a subset of the tree must instead use `search`
or filter the returned nodes themselves.
