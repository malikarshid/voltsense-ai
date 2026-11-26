/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/api/v1/:path*`
          : 'http://127.0.0.1:8000/api/v1/:path*',
      },
      {
        source: '/health',
        destination: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/health`
          : 'http://127.0.0.1:8000/health',
      },
    ];
  },
};

export default nextConfig;
