/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth"],
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
