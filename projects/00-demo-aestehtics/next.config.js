/** @type {import('next').NextConfig} */

// Two shapes, one config.
//
// Development keeps the rewrite proxy so `npm run dev` reaches a backend on
// localhost without CORS. Production is a static export: this dashboard is one
// of six merged into a single Cloudflare Pages project under
// data-analyst.gonor.me, where a Pages Function -- not Next -- serves /api/*.
// `rewrites()` has no meaning in a static export, so it must be absent there.
//
// This project owns the root of the merged site: its `/` is the portfolio
// landing page, and its favicon and 404 are the ones served at the root.
const isDevelopment = process.env.NODE_ENV === 'development'

const nextConfig = isDevelopment
  ? {
      async rewrites() {
        // OLIST_BACKEND_URL is a server-side env var (no NEXT_PUBLIC_ prefix).
        const backend = process.env.OLIST_BACKEND_URL || 'http://localhost:2050'
        return [
          {
            source: '/api/olist/:path*',
            destination: `${backend}/:path*`,
          },
        ]
      },
    }
  : {
      output: 'export',
      trailingSlash: true,
    }

module.exports = nextConfig
