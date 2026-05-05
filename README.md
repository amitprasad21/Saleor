# Saleor 👀 – The Ultimate AI Price Tracking & Deals SaaS

![Platform UI](https://img.shields.io/badge/Next.js%2015+-React%2019-black) ![Clerk Auth](https://img.shields.io/badge/Clerk-Authentication-purple) ![Monetization](https://img.shields.io/badge/Monetized-Freemium-green) ![Data Extraction](https://img.shields.io/badge/Apify-Web_Scraping-blue)

Saleor is a full-stack, comprehensive E-Commerce SaaS that acts as your personal shopping assistant. We track real-time price drops from India's greatest platforms (Amazon, Flipkart, Zepto, Quick Commerce) and immediately ping users via Email and Telegram when prices plunge. 

<br />

## ⚡ Core Functionalities & Latest Features

- **Apify Headless Scraping Automation**: We have natively integrated `apify-client` to dynamically bypass anti-bot protections and fetch current prices, historical data, and restocks directly from live store domains.
- **Deep Email & Telegram Push Notifications**: Seamlessly binds to your identity. When a product drops past the threshold, it triggers an instant Telegram DM or Email containing a direct link right back to your native Saleor Tracking Dashboard. 
- **Automated Authentication Tracking**: Thanks to our deep **Clerk Auth** hooks, anytime a signed-in user scrapes a new link via the Searchbar, the database automatically provisions and binds their tracking hooks to that product. No repetitive forms!
- **Dynamic Price History Visualizations**: Features a 100% dependency-free, pure CSS dynamic Bar Chart graphic injected directly into Product Details pages. Even brand new products are seeded with origin mapping to draw instantaneous trajectories. 
- **Platform Agnostic UI Engine**: Highly optimized Next.js 15 Server Components cleanly extract raw vendor URLs and systematically map them to live brand SVG assets, rendering crisp Amazon, Myntra, or Flipkart logos natively over standard affiliate product cards.
- **Aggressive Mobile-First Alignment**: The frontend UI tree utilizes extreme responsiveness via snap-scrolling Flex horizontal carousels, dynamically scaled hero-images, and Tailwind viewport breakpoints to prevent 112px grid-shatterings on iOS/Android displays.
- **Built-in Income (Passive + Active)**: 
   - Uses `addAffiliateTag()` to ensure every outbound click generates revenue securely via native mailto/share hooks and standard storefront links.
   - Freemium paywalls (via Clerk + Stripe) allowing restricted free search vs PRO tracked unlimited limits.

<br/>

## 🛠️ Tech Stack & Architecture

**Core:** Next.js 15+ App Router, React 19, TypeScript  
**Database:** MongoDB Atlas via strictly-awaited Mongoose routines  
**Auth:** Clerk.com Server Actions  
**Scraping Engine:** Apify API (Stealth Actors)  
**Mailing:** Nodemailer (Hotmail/Outlook automated pooling)  

### Environment Variables (.env)

To run the platform yourself, clone the repository and configure your `.env` securely. Ensure you never commit your production keys!

```env
# Database
MONGODB_URI=your_mongodb_cluster_string

# Core Extraction Engine
APIFY_API_TOKEN=your_apify_secret_token

# Instant Alert Hooks
TELEGRAM_BOT_TOKEN=your_botfather_token
EMAIL_PASSWORD=your_nodemailer_smtp_password

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Monetization
AMAZON_AFFILIATE_TAG=yourstore-21
FLIPKART_AFFILIATE_ID=yourFlipId

# Infrastructure
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

*Start the system locally:* `npm install` && `npm run dev`

---

## 🏗️ 1K Daily User Scaling & Engineering Roadmap

If this application scales to securely handle heavy active usage, the current asynchronous architecture solves historical Mongoose dropout crashes, but requires these explicit next steps:

1. **Decouple Scraping from UI Requests (Message Queuing):** Currently, when a user drops an Amazon link in the Searchbar, the user's browser relies on a beautiful frontend `loading.tsx` interceptor while awaiting the Apify API resolution. Wrap `scrapeAndStoreProduct` in an asynchronous Job Queue (like Upstash QStash or BullMQ) to reply instantly ("Added to queue!"). 
2. **Setup Background CRON Jobs:** The system effectively maps triggers upon manual scrapes. Using Vercel Cron, configure a route `/api/cron` to loop through Active Tracks every 2 hours securely pushing massive Apify batch evaluations in the background to detect `discountRate` spikes silently.
3. **Data Caching:** Before hitting the DB or the Apify endpoints, ping Redis (Upstash) to see if a product (`productId`) was fetched in the last 15 minutes to save massive proxy bandwidth and protect your Apify compute allocations.
