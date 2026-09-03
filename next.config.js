/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
    domains: [
      "images.unsplash.com",
      "plus.unsplash.com",
      "live.staticflickr.com",
      "images.pexels.com",
      "blogger.googleusercontent.com",
      "lh3.googleusercontent.com",
      "1.bp.blogspot.com",
      "2.bp.blogspot.com",
      "3.bp.blogspot.com",
      "4.bp.blogspot.com",
      "bp.blogspot.com",
      "vnysdevtdowrrjoendrw.supabase.co"
    ],
  },
};
module.exports = nextConfig;
