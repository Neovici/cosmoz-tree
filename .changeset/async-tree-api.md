---
'@neovici/cosmoz-tree': major
---

Make the Tree API async

All public methods of `Tree` now return promises. For an in-memory tree the
work itself is unchanged, so an `await` resolves in a microtask, but every
call site has to await.

This is the groundwork for `OnDemandTree`, which fetches nodes on demand and
cannot answer synchronously.
