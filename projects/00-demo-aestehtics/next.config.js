/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // OLIST_BACKEND_URL is a server-side env var (no NEXT_PUBLIC_ prefix).
    // Dev: http://localhost:2050  |  Prod: Cloud Run service URL
    const backend = process.env.OLIST_BACKEND_URL || 'http://localhost:2050'
    return [
      {
        source: '/api/olist/:path*',
        destination: `${backend}/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
