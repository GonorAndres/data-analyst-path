const nextConfig = {
  async rewrites() {
    const backend = process.env.PORTFOLIO_BACKEND_URL || 'http://localhost:2055'
    return [
      {
        source: '/api/portfolio/:path*',
        destination: `${backend}/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
