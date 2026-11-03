---
'@neovici/cosmoz-tree': minor
---

revert: make the Tree API async (#127)

The API returns to the synchronous signatures of 3.x. #129's removal of the
`nodes`/`nodeObj` parameters stays. The async release (4.0.0) added `await`
over unchanged in-memory data without a loading capability, and no known
consumer relies on returned promises — `await` on synchronous values remains
valid — so the revert ships as a minor.
