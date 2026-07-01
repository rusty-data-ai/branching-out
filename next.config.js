/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // `ws` (pulled in by @supabase/realtime-js) lists these native speed-ups as
    // optional dependencies. They aren't needed in the browser/serverless build,
    // so mark them external to silence "Module not found" warnings.
    config.externals = config.externals || [];
    config.externals.push({ bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate" });
    return config;
  },
};

module.exports = nextConfig;
