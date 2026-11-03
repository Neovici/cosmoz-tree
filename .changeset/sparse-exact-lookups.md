---
'@neovici/cosmoz-tree': minor
---

feat: add `exactPathLookup` option for sparse trees

A sparse tree answers only full-chain matches: a path with an unknown segment answers with `undefined` from `getPathNodes`, `getNodeByPathLocator` and `getPathString`. Loose mode keeps the nearest-match behavior for dense trees. Exact lookups keep the in-place completion contract: updating a node's `children` on a held node object is safe and visible to all reads.