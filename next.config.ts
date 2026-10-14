import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Practice tests are read from disk at request time; make sure every file
  // in data/tests ships with the deployed server code.
  outputFileTracingIncludes: {
    "/exams": ["./data/tests/**/*.json"],
    "/exams/[id]": ["./data/tests/**/*.json"],
    "/exams/custom": ["./data/tests/**/*.json"],
    "/api/practice-questions": ["./data/tests/**/*.json"]
  },
  // Old URLs, and URLs from the unreleased redesign, keep working.
  async redirects() {
    return [
      { source: "/tests", destination: "/exams", permanent: true },
      { source: "/tests/:path*", destination: "/exams/:path*", permanent: true },
      { source: "/practice-questions", destination: "/learn", permanent: true },
      { source: "/practice-questions/:path*", destination: "/learn/:path*", permanent: true },
      { source: "/practice", destination: "/roleplays", permanent: true },
      { source: "/progress", destination: "/account", permanent: false },
      { source: "/progress/tests/:id", destination: "/account/tests/:id", permanent: false },
      { source: "/exams/set/:id", destination: "/learn/set/:id", permanent: false },
      { source: "/exams/deca/:id", destination: "/exams/:id", permanent: false },
      { source: "/exams/library/:id", destination: "/exams/:id", permanent: false },
      { source: "/roleplays/round/:id", destination: "/roleplays", permanent: false }
    ];
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
