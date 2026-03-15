const nextConfig = {
  async rewrites() {
    const backend = process.env.ABTEST_BACKEND_URL || 'http://localhost:2053'
    return [
      {
        source: '/api/abtest/:path*',
        destination: `${backend}/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
