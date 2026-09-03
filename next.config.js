/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com","plus.unsplash.com",
      "live.staticflickr.com","images.pexels.com",
      "blogger.googleusercontent.com","lh3.googleusercontent.com",
      "1.bp.blogspot.com","2.bp.blogspot.com","3.bp.blogspot.com",
      "4.bp.blogspot.com","bp.blogspot.com"
    ],
    formats: ["image/avif","image/webp"],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ]
    }];
  },
};
module.exports = nextConfig;
