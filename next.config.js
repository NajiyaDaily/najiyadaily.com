/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: [
      "images.unsplash.com", "plus.unsplash.com",
      "live.staticflickr.com", "images.pexels.com",
      "blogger.googleusercontent.com", "lh3.googleusercontent.com",
      "1.bp.blogspot.com","2.bp.blogspot.com","3.bp.blogspot.com",
      "4.bp.blogspot.com","bp.blogspot.com",
      "vnysdevtdowrrjoendrw.supabase.co",
    ],
  },
  async redirects() {
    return [
      // Redirect bare domain to www
      {
        source: "/:path*",
        has: [{ type: "host", value: "najiyadaily.com" }],
        destination: "https://www.najiyadaily.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/favicon.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
