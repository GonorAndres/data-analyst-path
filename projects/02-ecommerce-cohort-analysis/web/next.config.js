/** @type {import('next').NextConfig} */

// This dashboard has no backend. Everything it draws comes from static JSON in
// public/cohorts/data/, built by data-pipeline/05_build_web_json.py -- so unlike
// its five API-backed siblings there is no rewrite proxy to configure in
// development, and the production shape is the only shape.
//
// It is one of seven apps merged into a single Cloudflare Pages project, and its
// routes already live under /cohorts, so no basePath is needed.
const nextConfig = {
  output: 'export',
  trailingSlash: true,
}

module.exports = nextConfig
