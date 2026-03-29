import { EmailProductInfo } from '@/types';

/**
 * Telegram Bot Integration for Free Instant Push Notifications!
 * 
 * Instructions to set this up for free:
 * 1. Open Telegram and search for "BotFather".
 * 2. Send "/newbot" and follow instructions to create a bot.
 * 3. BotFather will give you a BOT_TOKEN. Add it to your .env file as TELEGRAM_BOT_TOKEN.
 * 4. Your users will start a chat with your bot. You save their Telegram Chat ID in your DB.
 * 5. Add that chat ID to .env as TELEGRAM_ADMIN_CHAT_ID (for testing).
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const sendTelegramAlert = async (product: EmailProductInfo, chatId: string, alertType: string) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is missing. Please add it to your .env file.");
    return;
  }

  let message = "";

  if (alertType === "LOWEST_PRICE") {
    message = `🚨 *LOWEST PRICE ALERT* 🚨\n\n${product.title}\n\nIt is now at its lowest price ever! Grab it before it's gone.\n\n🛒 [Buy it now](${product.url})`;
  } else if (alertType === "CHANGE_OF_STOCK") {
    message = `⚡ *BACK IN STOCK* ⚡\n\n${product.title}\n\nThe product is back in stock! Quick commerce waits for no one.\n\n🛒 [Buy it now](${product.url})`;
  } else {
    message = `🔔 *PriceWise Update* 🔔\n\n${product.title}\n\nCheck out the latest update on your tracked product.\n\n🛒 [View Product](${product.url})`;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
        console.error("Telegram API Error:", data.description);
    } else {
        console.log(`Telegram alert sent successfully to chat ${chatId}!`);
    }
  } catch (error) {
    console.error("Failed to send Telegram alert", error);
  }
};
