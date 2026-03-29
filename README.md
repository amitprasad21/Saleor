# Saleor 👀 – The Ultimate AI Price Tracking & Deals SaaS

![Platform UI](https://img.shields.io/badge/Next.js%2016-React%2019-black) ![Clerk Auth](https://img.shields.io/badge/Clerk-Authentication-purple) ![Monetization](https://img.shields.io/badge/Monetized-Freemium-green)

Saleor is a full-stack, Next.js E-Commerce SaaS that acts as your personal shopping assistant. We track real-time price drops from India's greatest platforms (Amazon, Flipkart, Zepto, Quick Commerce) and immediately ping users via Telegram when prices plunge.

<br />

## ⚡ Core Functionality

- **Smart Scraping Automation**: Utilizing custom headless automation to dynamically fetch current prices, historical data, and restocks.
- **Immediate Push Notifications (Telegram Bot)**: Unlike emails that get buried in spam, users receive lightning-fast Telegram DMs. Perfect for Quick Commerce 15-minute drops.
- **Dynamic Trending Board**: The home screen mathematically curates and updates products yielding the deepest discounts (`discountRate`), drawing immediate clicks.
- **Built-in Income (Passive + Active)**: 
   - Uses `addAffiliateTag()` to ensure every outbound click generates revenue.
   - Freemium paywalls (via Clerk + Stripe) allowing restricted free search vs PRO tracked unlimited limits.

<br/>

## 🛠️ Tech Stack & Setup

**Core:** Next.js 16 (App Router), React 19, TypeScript  
**Database:** MongoDB via Mongoose  
**Auth & Billing:** Clerk.com & Stripe  
**Scraping:** Cheerio & Bright Data (or Puppeteer Stealth)  

### Environment Variables

To run the platform yourself, clone the repository and configure your `.env`:

```env
# Database
MONGODB_URI=your_mongodb_cluster_string

# Scraping API
BRIGHT_DATA_USERNAME=your_brightdata_user
BRIGHT_DATA_PASSWORD=your_brightdata_pass

# Instant Telegram Alerts
TELEGRAM_BOT_TOKEN=your_botfather_token

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Monetization
AMAZON_AFFILIATE_TAG=yourstore-21
FLIPKART_AFFILIATE_ID=yourFlipId
```

*Start the system locally:* `npm install` && `npm run dev`

---

## 🏗️ 1K Daily User Scaling & SaaS Roadmap

If this application suddenly hits 1,000 Concurrent DAA (Daily Active Users), the current synchronous V1 structure needs these scaling fixes:

1. **Decouple Scraping from UI Requests (Message Queuing):** Currently, when a user drops an Amazon link in the Searchbar, the user's browser spins forever awaiting the Scraper to finish. You must wrap `scrapeAndStoreProduct` in an asynchronous Job Queue (like Upstash QStash or BullMQ). Let the server reply immediately ("Added to queue! We'll alert you soon."). 
2. **Setup Background CRON Jobs:** The system does not currently poll for price changes on its own. Using Vercel Cron, configure a route `/api/cron` to loop through Active Tracks every 2 hours securely.
3. **Data Caching:** Before hitting the DB, ping Redis (Upstash) to see if a product (`productId`) was fetched in the last 15 minutes to save proxy bandwidth.
