/** @type {import('next').NextConfig} */

// Two shapes, one config.
//
// Development keeps the rewrite proxy so `npm run dev` reaches a backend on
// localhost without CORS. Production is a static export: this dashboard is one
// of six merged into a single Cloudflare Pages project under
// data-analyst.gonor.me, where a Pages Function -- not Next -- serves /api/*.
// `rewrites()` has no meaning in a static export, so it must be absent there.
const isDevelopment = process.env.NODE_ENV === 'development'

const nextConfig = isDevelopment
  ? {
      async rewrites() {
        const backend = process.env.KPI_BACKEND_URL || 'http://localhost:2052'
        return [
          {
            source: '/api/kpi/:path*',
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
