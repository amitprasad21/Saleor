"use server"

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeWithApify } from "../scraper/apify"; // Official Apify Integration
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function scrapeAndStoreProduct(productUrl: string) {
  if(!productUrl) return;

  try {
    await connectToDB();

    // EXCLUSIVE APIFY INTEGRATION: Routes target through Apify Headless Servers
    const scrapedProduct = await scrapeWithApify(productUrl);

    if(!scrapedProduct) return;

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    if(existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice }
      ]

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      }
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );

    // Completely automatic user tracking logic integration
    const { userId } = await auth();
    if (userId) {
       const client = await clerkClient();
       const userObj = await client.users.getUser(userId);
       const userEmail = userObj.emailAddresses[0]?.emailAddress;
       const telegramChatId = userObj?.publicMetadata?.telegramChatId as string | undefined;
       
       if (userEmail && !newProduct.users.some((user: any) => user.email === userEmail)) {
          newProduct.users.push({ email: userEmail, telegramChatId });
          await newProduct.save();
       }
    }

    revalidatePath(`/products/${newProduct._id}`);
    revalidatePath(`/`); // Synchronize the homepage Trending section

    return newProduct._id.toString();
  } catch (error: any) {
    throw new Error(`Failed to create/update product: ${error.message}`)
  }
}

export async function getProductById(productId: string) {
  try {
    await connectToDB();

    const product = await Product.findOne({ _id: productId });

    if(!product) return null;

    return product;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts() {
  try {
    await connectToDB();

    const products = await Product.find();

    return products;
  } catch (error) {
    console.log(error);
  }
}

export async function getTrendingProducts() {
  try {
    await connectToDB();

    // Fetch the products sorted by their discountRate (highest first)
    // We limit it to top 4 products for the homepage
    const trendingProducts = await Product.find({})
      .sort({ discountRate: -1 })
      .limit(4);

    return trendingProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    await connectToDB();

    const currentProduct = await Product.findById(productId);

    if(!currentProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
  try {
    const product = await Product.findById(productId);

    if(!product) return;

    // Effortlessly sync their Telegram if they linked it through Clerk
    const { userId } = await auth();
    let telegramChatId: string | undefined = undefined;
    
    if (userId) {
      const client = await clerkClient();
      const userObj = await client.users.getUser(userId);
      telegramChatId = userObj?.publicMetadata?.telegramChatId as string;
    }

    const userExists = product.users.some((user: User) => user.email === userEmail);

    if(!userExists) {
      product.users.push({ email: userEmail, telegramChatId });

      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");
      await sendEmail(emailContent, [userEmail]);

      // If Telegram is linked, send them an instant tracking confirmation!
      if (telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: `✅ *Item Tracked!*\n\nYou're now tracking: ${product.title}.\nWe'll alert you the second it drops!`,
            parse_mode: 'Markdown'
          })
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export async function removeUserEmailFromProduct(productId: string, userEmail: string) {
  try {
    const product = await Product.findById(productId);

    if(!product) return;

    // Filter out the requested user to cleanly stop notifications but KEEP product in DB entirely
    product.users = product.users.filter((user: User) => user.email !== userEmail);

    await product.save();

    revalidatePath(`/products/${productId}`);
  } catch (error) {
    console.log(error);
  }
}