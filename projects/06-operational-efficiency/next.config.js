/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/ops/:path*',
        destination: `${process.env.OPS_BACKEND_URL || 'http://localhost:2056'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
