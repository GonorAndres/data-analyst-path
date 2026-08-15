/**
 * Header handling shared by the two proxy Functions.
 *
 * Both had the same bug on first run and it is worth naming, because nothing
 * about it looks wrong in the code: copying the upstream response's headers
 * verbatim onto a new Response.
 *
 * The Workers runtime negotiates compression with the upstream itself and hands
 * back a body that may already be decoded, and it re-encodes on the way out
 * according to what the client asked for. An inherited `content-encoding: br`
 * or `content-length` therefore describes bytes that no longer exist -- the
 * client dutifully tries to brotli-decode plain JavaScript and gets binary
 * garbage, or reads a `content-length: 0` and sees an empty body. Observed
 * exactly that on `/ingest/static/array.js` and `/ingest/flags` before this.
 *
 * Let the runtime own the framing headers. Everything else passes through.
 */

const STRIP_FROM_RESPONSE = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
]

/** Upstream response headers, minus the ones the runtime must set itself. */
export function passthroughHeaders(upstream: Response): Headers {
  const headers = new Headers(upstream.headers)
  for (const name of STRIP_FROM_RESPONSE) headers.delete(name)
  return headers
}

/**
 * Client request headers, minus the ones that must not be forwarded.
 *
 * `accept-encoding` is dropped so the runtime negotiates compression on its own
 * terms and reliably hands back a decoded body. `host` would name this site
 * rather than the upstream. `cookie` carries first-party cookies that belong to
 * this origin and to nobody else.
 */
export function forwardHeaders(request: Request): Headers {
  const headers = new Headers(request.headers)
  for (const name of ['accept-encoding', 'host', 'cookie', 'cf-connecting-ip']) {
    headers.delete(name)
  }
  return headers
}
