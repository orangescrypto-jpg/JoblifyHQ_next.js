/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      fs: { browser: './src/empty.js' },
      net: { browser: './src/empty.js' },
      tls: { browser: './src/empty.js' },
    },
  },
};

export default nextConfig;
