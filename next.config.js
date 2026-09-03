/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol:"https", hostname:"images.unsplash.com" },
      { protocol:"https", hostname:"plus.unsplash.com" },
      { protocol:"https", hostname:"live.staticflickr.com" },
      { protocol:"https", hostname:"images.pexels.com" },
      { protocol:"https", hostname:"blogger.googleusercontent.com" },
      { protocol:"https", hostname:"lh3.googleusercontent.com" },
      { protocol:"https", hostname:"*.bp.blogspot.com" },
      { protocol:"https", hostname:"bp.blogspot.com" },
    ],
    formats: ["image/avif","image/webp"],
    unoptimized: true,   // Required for static export compatibility
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key:"X-Frame-Options",        value:"DENY" },
        { key:"X-Content-Type-Options",  value:"nosniff" },
        { key:"Referrer-Policy",         value:"strict-origin-when-cross-origin" },
      ]
    }];
  },
};
module.exports = nextConfig;
