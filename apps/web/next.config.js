/** One static frontend; Pages Functions own the production API proxy. */
const development = process.env.NODE_ENV === 'development'

module.exports = {
  distDir: development ? '.next-dev' : '.next',
  trailingSlash: true,
  ...(development ? {
    async rewrites() {
      const origin = process.env.API_ORIGIN || 'http://localhost:8080'
      return ['insurance', 'olist', 'abtest', 'kpi', 'portfolio', 'ops'].map(service => ({
        source: `/api/${service}/:path*`,
        destination: `${origin}/${service}/:path*`,
      }))
    },
  } : { output: 'export' }),
  experimental: { cpus: 2 },
}
