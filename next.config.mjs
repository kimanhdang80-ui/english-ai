import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal server bundle for Docker / Railway.
  output: 'standalone',
  poweredByHeader: false,
  // Pin file-tracing root to this project (a sibling lockfile exists in the
  // parent workspace directory).
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
