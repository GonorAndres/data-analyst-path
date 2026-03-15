const nextConfig = {
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
module.exports = nextConfig
