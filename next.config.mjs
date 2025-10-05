/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow downloading files from external sources
  experimental: {
    serverActions: {
      allowedOrigins: ['it.pk.edu.pl'],
    },
  },
};

export default nextConfig;
