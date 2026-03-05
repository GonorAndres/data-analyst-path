/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // INSURANCE_BACKEND_URL is a server-side env var (no NEXT_PUBLIC_ prefix).
    // Dev: http://localhost:2051  |  Prod: Cloud Run service URL
    const backend = process.env.INSURANCE_BACKEND_URL || 'http://localhost:2051'
    return [
      {
        source: '/api/insurance/:path*',
        destination: `${backend}/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
