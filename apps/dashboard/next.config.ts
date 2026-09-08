import type { NextConfig } from 'next';

const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || 'localhost,127.0.0.1,10.10.14.198,*.local')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};
export default nextConfig;
