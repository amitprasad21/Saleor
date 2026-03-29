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
          // This block runs perfectly inside Apify's remote Stealth Browser
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
    
    const htmlString = items?.[0]?.html;

    if (!htmlString) throw new Error("Apify failed to return HTML structure.");

    // Load the HTML into our Cheerio parser
    const $ = cheerio.load(htmlString as string);

    // Extract the exact same data variables using our generic selectors!
    const title = $('#productTitle').text().trim();
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base')
    );

    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price')
    );

    const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

    const images = 
      $('#imgBlkFront').attr('data-a-dynamic-image') || 
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}'

    const imageUrls = Object.keys(JSON.parse(images));
    const currency = extractCurrency($('.a-price-symbol'))
    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");
    const description = extractDescription($)

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '$',
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    }

    return data;
  } catch (error: any) {
    console.error(`Apify Scraping Error: ${error.message}`);
    throw new Error(`Apify Scraping Error: ${error.message}`);
  }
}
