import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    GODADDY_API_KEY: process.env.GODADDY_API_KEY,
    GODADDY_API_SECRET: process.env.GODADDY_API_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NAMECHEAP_API_KEY: process.env.NAMECHEAP_API_KEY,
    NAMECHEAP_API_USER: process.env.NAMECHEAP_API_USER,
    NAMECHEAP_CLIENT_IP: process.env.NAMECHEAP_CLIENT_IP,
  },
  serverRuntimeConfig: {
    GODADDY_API_KEY: process.env.GODADDY_API_KEY,
    GODADDY_API_SECRET: process.env.GODADDY_API_SECRET,
  },
};

export default nextConfig;
