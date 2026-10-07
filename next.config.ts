import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Practice tests are read from disk at request time; make sure every file
  // in data/tests ships with the deployed server code.
  outputFileTracingIncludes: {
    "/tests": ["./data/tests/**/*.json"],
    "/tests/[id]": ["./data/tests/**/*.json"],
    "/tests/custom": ["./data/tests/**/*.json"],
    "/api/practice-questions": ["./data/tests/**/*.json"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
