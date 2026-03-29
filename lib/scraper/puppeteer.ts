"use server"

import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from '../utils';

export async function scrapeWithPuppeteer(url: string) {
  if (!url) return;

  let browser;
  try {
    const puppeteer = (await import('puppeteer')).default;
    
    console.log(`Launching Puppeteer for: ${url}`);
    
    // Launch standard headless browser for local dev
    // NOTE: For Vercel Production, you MUST use @sparticuz/chromium
    browser = await puppeteer.launch({
      headless: true, // Use 'new' or true based on puppeteer version
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Go to the URL and wait for the network to be mostly idle (good for SPAs like Zepto/Blinkit)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract the raw HTML
    const html = await page.content();
    const $ = cheerio.load(html);

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

    console.log("Scraped Data Successfully:", data.title);
    return data;

  } catch (error: any) {
    console.error("Puppeteer Scraping Failed:", error);
    throw new Error(`Puppeteer Scraping Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
