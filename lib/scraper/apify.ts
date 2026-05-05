"use server"

import { ApifyClient } from 'apify-client';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from '../utils';

export async function scrapeWithApify(url: string) {
  if(!url) return null;

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

  if(!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not defined in your environment variables.');
  }

  // Initialize the ApifyClient with your API token
  const client = new ApifyClient({
    token: APIFY_API_TOKEN,
  });

  try {
    console.log(`Starting Apify scrape for: ${url}`);
    
    // We use Apify's official Web Scraper to run a stealth headless browser on their servers
    const input = {
      startUrls: [{ url }],
      useChrome: true,
      pageFunction: `async function pageFunction(context) {
          // Wait for network idle to ensure SPAs (like Flipkart) are loaded
          await context.page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
          const result = await context.page.evaluate(() => document.documentElement.outerHTML);
          return { html: result };
      }`,
      proxyConfiguration: {
          useApifyProxy: true
      }
    };

    // Run the actor and wait for it to finish
    const run = await client.actor("apify/puppeteer-scraper").call(input);

    // Fetch the results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    const htmlString = items?.[0]?.html as string;

    if (!htmlString) throw new Error("Apify failed to return HTML structure.");

    console.log(`Extracted HTML snippet: ${htmlString.substring(0, 500)}`);

    // Load the HTML into our Cheerio parser
    const $ = cheerio.load(htmlString as string);

    // ==========================================
    // 1. GENERIC & PLATFORM-SPECIFIC EXTRACTION
    // ==========================================
    
    const hostname = new URL(url).hostname.toLowerCase();
    let title = '';
    let currentPrice = '';
    let originalPrice = '';
    let imageUrl = '';
    let outOfStock = false;

    // --- AMAZON SPECIFIC ---
    if (hostname.includes('amazon')) {
      title = $('#productTitle').text().trim();
      currentPrice = extractPrice(
        $('.priceToPay span.a-price-whole'),
        $('.a.size.base.a-color-price'),
        $('.a-button-selected .a-color-base')
      );
      originalPrice = extractPrice(
        $('#priceblock_ourprice'),
        $('.a-price.a-text-price span.a-offscreen'),
        $('#listPrice'),
        $('#priceblock_dealprice'),
        $('.a-size-base.a-color-price')
      );
      outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';
      const imagesAttr = $('#imgBlkFront').attr('data-a-dynamic-image') || $('#landingImage').attr('data-a-dynamic-image') || '{}';
      imageUrl = Object.keys(JSON.parse(imagesAttr))[0] || '';

    // --- FLIPKART SPECIFIC ---
    } else if (hostname.includes('flipkart')) {
      title = $('.B_NuCI, .VU-Tz5').text().trim();
      currentPrice = extractPrice($('._30jeq3, .Nx9bqj'));
      originalPrice = extractPrice($('._3I9_wc, .yRaY8j'));
      outOfStock = $('button:contains("NOTIFY ME"), ._16FRp0').length > 0;
      imageUrl = $('img._396cs4, img.v2p6cc, img.DByuf4').attr('src') || '';

    // --- MYNTRA SPECIFIC ---
    } else if (hostname.includes('myntra')) {
      title = $('h1.pdp-title').text().trim() + ' ' + $('h1.pdp-name').text().trim();
      currentPrice = extractPrice($('.pdp-price strong'));
      originalPrice = extractPrice($('.pdp-mrp s'));
      outOfStock = $('.pdp-out-of-stock, .out-of-stock').length > 0;
      imageUrl = $('.image-grid-image').attr('style')?.match(/url\("(.*)"\)/)?.[1] || '';

    } 
    // --- GENERIC FALLBACK (For Zepto, Blinkit, Ajio, TataCliq, etc.) ---
    else {
      // 1. Try to find Schema.org JSON-LD for standardized e-commerce scraping!
      const jsonLdConfigs = $('script[type="application/ld+json"]');
      
      jsonLdConfigs.each((_, el) => {
        try {
          const text = $(el).html();
          if (text) {
             const json = JSON.parse(text);
             // Sometimes schema is an array
             const items = Array.isArray(json) ? json : [json];
             
             for (const item of items) {
                if (item['@type'] === 'Product') {
                  if (!title) title = item.name;
                  if (!imageUrl) imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
                  
                  // Extract offer price
                  if (item.offers) {
                     const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                     if (!currentPrice) currentPrice = String(offer.price);
                     if (offer.availability && offer.availability.includes('OutOfStock')) {
                       outOfStock = true;
                     }
                  }
                }
             }
          }
        } catch(e) {}
      });

      // 2. Generic DOM fallback if JSON-LD fails
      if (!title) title = $('h1').first().text().trim() || $('title').text().trim();
      if (!currentPrice) currentPrice = extractPrice($('[class*="price"], [class*="Price"], [data-test-id*="price"]'));
      if (!originalPrice && currentPrice) originalPrice = extractPrice($('[class*="mrp"], [class*="strike"], [class*="old-price"], s, strike'));
      if (!imageUrl) imageUrl = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src') || '';
    }

    // Clean up generic extractions
    const currency = extractCurrency($('.a-price-symbol')) || '₹'; // Defaulting to INR for Indian e-com
    const description = extractDescription($);

    // Calculate discount
    const numCurrentPrice = Number(currentPrice) || 0;
    const numOriginalPrice = Number(originalPrice) || numCurrentPrice;
    let discountRate = 0;
    
    if (numOriginalPrice > 0 && numCurrentPrice < numOriginalPrice) {
      discountRate = Math.round(((numOriginalPrice - numCurrentPrice) / numOriginalPrice) * 100);
    }

    // Ensure we don't return an invalid object that crashes MongoDB
    if (!title || !title.trim()) throw new Error("Failed to extract product title. It is possible the site is blocking the scraper.");

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '₹',
      image: imageUrl,
      title: title || 'Unknown Product',
      currentPrice: numCurrentPrice || numOriginalPrice,
      originalPrice: numOriginalPrice || numCurrentPrice,
      priceHistory: [],
      discountRate: discountRate,
      category: 'general',
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: numCurrentPrice || numOriginalPrice,
      highestPrice: numOriginalPrice || numCurrentPrice,
      averagePrice: numCurrentPrice || numOriginalPrice,
    };

    return data;
  } catch (error: any) {
    console.error(`Apify Scraping Error: ${error.message}`);
    throw new Error(`Apify Scraping Error: ${error.message}`);
  }
}
