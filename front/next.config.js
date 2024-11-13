/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },
  // output: 'export', // don't use with `next start` or api route
  // distDir: 'dist',
  // avoid cors with proxy
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:3005/:path*', // Proxy to Backend
  //     },
  //   ]
  // },

webpack(config, options) {
  config.module.rules.push({
    test: /\.(mp4|webm|ogg|swf|ogv)$/,
    use: {
      loader: 'file-loader',
      options: {
        publicPath: '/_next/static/videos/',
        outputPath: 'static/videos/',
        name: '[name].[hash].[ext]',
        esModule: false,
      },
    },
  })

  return config
},
}

module.exports = nextConfig