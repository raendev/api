RAEN's centralized schema API
=============================

You don't always need an API to use RAEN.

But when you do, this one's easy and free.

You can do all of this with the RAEN CLI just as easily (coming soon!), but sometimes an API is nice:

- If you've got a server-side rendered (SSR) frontend, you can hit this API to get fast cached contract schemas, so your users don't need to wait for client-side fetches
- OK, even if you've got a static frontend with client-side fetches, using this API might save one network request and some client-side processing


Use It
======

    GET https://api.raen.dev/[CONTRACT_NAME].json

Returns [JSON Schema](https://json-schema.org/) for CONTRACT_NAME. If the contract name ends in `.near`, it's assumed to be on NEAR's mainnet. Otherwise, it assumes NEAR's testnet.

This is the JSON Schema used by [RAEN Admin](https://raen.dev/admin) and other (upcoming) tooling.

Some notes:

* It first checks if the contract was built with RAEN, and, if so, converts the embedded WIT to JSON Schema (ok, that's aspirational; RAEN currently embeds brotli-compressed JSON Schema rather than WIT. Right now, this API extracts and decompresses this JSON Schema only.)
* [aspirational] If the contract was not built with RAEN, it checks if it was built with [Pagoda](https://www.pagoda.co/)'s ABI tooling. If it was, Pagoda's schema is converted to RAEN-compatible JSON Schema.
* [aspirational] If the contract has neither of these, a best-effort attempt is made to scrape together a maybe-acceptable schema. The strategy:
  - Hard-code schema for certain popular contracts. Otherwise:
  - Inspect Wasm binary for method names.
  - If method names match a known standard, fill in argument types matching standard (does not always match actual implementation!). Otherwise:
  - Scrape blockchain history to see how these methods were called, then assume the argument signature has not changed since then.

The third situation will return with a [203: Non-Authoritative Information](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203) status code.
