import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/site";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // The bare Vercel domain has nothing at its root, so send visitors to the course.
    return [{ source: "/", destination: BASE_PATH, basePath: false, permanent: false }];
  },
};

export default nextConfig;
