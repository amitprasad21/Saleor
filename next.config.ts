/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose', 'apify-client', 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow other e-commerce images as per objective
      }
    ],
  }
}

module.exports = nextConfig
