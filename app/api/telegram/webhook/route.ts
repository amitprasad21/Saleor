import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Check if it's a message
    if (data.message && data.message.text) {
      const chatId = data.message.chat.id;
      const text = data.message.text;

      // Handle the /start connection command (e.g. /start user_2ZkX... )
      if (text.startsWith('/start ')) {
        const clerkUserId = text.replace('/start ', '').trim();

        // If the user appended their ID, we link it!
        if (clerkUserId) {
           const client = await clerkClient();
           await client.users.updateUserMetadata(clerkUserId, {
             publicMetadata: {
               telegramChatId: chatId.toString()
             }
           });

           // Reply back to the user celebrating the link
           await sendBotMessage(chatId, `🎉 *Success!* Your Saleor account is now securely linked to Telegram.\n\nYou will receive instant, lightning-fast price drop alerts right here. Premium service unlocked! 🚀`);
           return NextResponse.json({ ok: true });
        }
      }

      // Default responses
      if (text === '/start') {
        await sendBotMessage(chatId, `Welcome to Saleor Bot! 🤖\n\nPlease link your account directly from our website by clicking "Connect Telegram" inside your dashboard.`);
      } else if (text === '/help') {
        await sendBotMessage(chatId, `Need help? Just track a product inside the main Saleor app, and whenever the price plummets, we'll ping you here immediately!`);
      } else {
        await sendBotMessage(chatId, `I am currently monitoring prices for you. Please manage your tracks via the website!`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Telegram messaging helper
async function sendBotMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if(!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}
