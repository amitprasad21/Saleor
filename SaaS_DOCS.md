# Saleor SaaS Full Architecture Documentation

This document covers everything required to manage, extend, and secure the Saleor Platform. 

## 1. Auth & Billing Secure Integration (Clerk + Payments)

**Clerk** handles the Session Management via JWT and Middlewares (`proxy.ts` / `middleware.ts`). 
To ensure a secure payment pipeline (Stripe/Razorpay), you must NEVER trust the frontend to assign a user their "PRO" role. 

**Proper Transaction Edge Case Handling:**
1. User clicks "Upgrade to PRO". 
2. App generates a Stripe Checkout session with `clerk_user_id` passed heavily inside `metadata`.
3. User completes payment.
4. **CRUCIAL STEP:** Implement a Webhook endpoint (`/api/webhooks/stripe/route.ts`). You MUST use `stripe.webhooks.constructEvent()` combined with a Stripe Secret. If you don't do this, malicious users can fire fake POST requests to your API giving themselves PRO for free.
5. In the Webhook, read the `metadata.clerk_user_id`, run `clerkClient().users.updateUserMetadata(clerk_id, { publicMetadata: { role: "PRO" }})`.
6. From then onwards, restrict access inside the Server actions: `if(auth().sessionClaims?.metadata.role !== 'PRO') return "Upgrade!"`

## 2. Alternate "Indirect" Monetization Models

You mentioned you only want ways to make money *without* relying on affiliate links (as Zepto/Blinkit might not offer APIs). 
- **Sponsored Search Placements**: Charge D2C brands (like BoAt, Noise) ₹5k/mo to permanently pin their product onto your `getTrendingProducts` board array.
- **Lead Generation / Sentiment Analysis**: If 2,000 users track a specific Protein Powder waiting for a drop, you can sell that aggregated "Demand Report" directly to the Protein brand indicating they are pricing out massive volume. 
- **Display Ads via CarbonAds**: Simple non-intrusive developer/startup friendly ad blocks.
- **Newsletter Drop Model:** Force users to give you their email to use the tool. Sell ad slots strictly in your weekly "Top 10 Price Drops" email blast.

## 3. Current Synchronization Bugs & Mistakes 

Here is everything misconfigured right now:

1. **Frontend / DB Desync:** 
   - *Bug:* The home page does not aggressively fetch new DB prices unless triggered via user manual entry. 
   - *Fixed:* I added `revalidatePath('/')` inside the scraper to instantly wipe the static cache whenever a search goes through.
2. **Missing CRON Job Engine:**
   - *Mistake:* Your app tracks prices only when specifically commanded by a form submit. A real SaaS needs an automated serverless trigger that constantly cycles the DB hourly and fires `scrapeAmazonProduct(dbUrl)`. 
3. **Overusing Database Reads for Common Data:**
   - *Bug:* Fetching `getTrendingProducts` fetches directly from `Mongoose.Product.find` on every single page load. If you hit 1,000 users an hour, MongoDB will rate-limit you or skyrocket your read units. Needs Upstash Redis wrap.
4. **Telegram Chat ID Mapping Missing:**
   - *Mistake:* `sendTelegramAlert()` takes a `chatId`, but your SaaS currently has no database schema line storing *which* Telegram Chat maps to *which* Clerk user. You need to enforce users linking their accounts via `/start <CLERK_ID>` magic links through the bot.

## 4. Feature Prompts for Future Development
*If you need me to expand the app, use these exact descriptive prompts next time:*

**Prompt to Add Serverless CRON Engine:**
> "Please construct a Next.js App Router background Cron API route in `/api/cron/route.ts` that queries MongoDB for all Products, loops through them in chunks of 5 using `Promise.allSettled`, calls the `scrapeAmazonProduct` helper, checks if the new `currentPrice` is lower than the db `currentPrice`, and if so fires the `sendTelegramAlert` logic, making sure to handle Vercel timeout limits."

**Prompt to Setup Secure Stripe Webhooks for Billing:**
> "Let's create the billing webhook for Clerk integration. Write `app/api/webhooks/stripe/route.ts` and set up `stripe.webhooks.constructEvent`. Extract the Clerk `userId` from the checkout session metadata, and execute a Clerk Server mutation via `clerkClient.users.updateUserMetadata` to elevate their role strictly to `PRO`. Please handle duplicate events."

**Prompt to Switch to Asynchronous Queued Scraping:**
> "Rewrite the synchronous Submit handler inside `Searchbar.tsx` so that it posts the Search URL to an Upstash QStash API route. Once confirmed, change the Search button state to 'Queued'. Write the subsequent Receiver API Route that accepts the Queue ping and performs the slow Cheerio scraping safely in the background."
