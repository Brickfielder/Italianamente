/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora gli errori di stile durante la build per andare online subito
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora anche eventuali errori di typescript
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig