/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Expose these server environment variables to the client
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
  }
};

module.exports = nextConfig;
