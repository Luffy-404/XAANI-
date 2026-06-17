import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-3b823233-5d38-40b8-8424-9bab6e85f2a8.space-z.ai",
    ".space-z.ai",
  ],
};

export default nextConfig;
