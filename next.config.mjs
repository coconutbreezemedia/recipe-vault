/** @type {import('next').NextConfig} */
// Static offline PWA — exported to plain HTML/JS for GitHub Pages.
// basePath is set at build time for project-site hosting (username.github.io/<repo>).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: true,
};
export default nextConfig;
