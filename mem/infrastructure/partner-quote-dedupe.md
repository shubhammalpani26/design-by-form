---
name: Partner slicer de-duplicates by file name
description: US manufacturing partner returns a stale price when two revisions of a piece are uploaded under the same name; quote uploads must carry a content fingerprint
type: feature
---
The US partner's file service de-duplicates uploads by name. Re-uploading a revised STL under the same item name returns the OLD slice price, silently.
`estimateLandedUnitCost` therefore appends a 4-byte SHA-256 fingerprint of the file url to the upload name.
Also: `originals_quotes` caches by `print_file_url` for 24h — delete those rows when re-registering a master model, or the ladder keeps showing the old retail.
