/**
 * Telegram Bot Script for Regal Platform
 * 
 * This bot handles the "Continue with Telegram" flow.
 * 1. User is redirected to the bot with a session_id.
 * 2. User shares their contact (phone number).
 * 3. Bot generates a 6-digit code and saves it to Supabase.
 * 4. User enters the code on the website to finish login.
 * 
 * Usage:
 * 1. Create a bot with @BotFather and get the token.
 * 2. Add TELEGRAM_BOT_TOKEN to your .env file.
 * 3. npm install node-telegram-bot-api
 * 4. npx ts-node telegram_bot.ts
 */

import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new TelegramBot(token, { polling: true });

// Simple in-memory session tracking (chatId -> sessionId)
const sessionStore = new Map<number, string>();

console.log('Telegram Bot is starting...');

// Handle /start command with session_id
bot.onText(/\/start (.+)/, async (msg: TelegramBot.Message, match: RegExpMatchArray | null) => {
  const chatId = msg.chat.id;
  const sessionId = match?.[1];

  if (!sessionId) {
    bot.sendMessage(chatId, 'Invalid start link. Please try again from the website.');
    return;
  }

  // Store session_id for this chat
  sessionStore.set(chatId, sessionId);

  const opts = {
    reply_markup: {
      keyboard: [
        [{
          text: 'Share My Profile (Phone Number)',
          request_contact: true
        }]
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };

  bot.sendMessage(chatId, `Welcome to Regal Platform! To continue with your login, please share your contact so we can verify your identity.`, opts);
});

// Handle contact sharing
bot.on('contact', async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  const sessionId = sessionStore.get(chatId);

  if (!contact || !contact.phone_number) {
    bot.sendMessage(chatId, 'Error receiving contact. Please try again.');
    return;
  }

  if (!sessionId) {
    bot.sendMessage(chatId, 'Session expired or invalid. Please click the login link on the website again.');
    return;
  }

  console.log(`Received contact for session ${sessionId}:`, contact.phone_number);

  // Generating a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. First, upsert the attempt into the database
    // We use upsert because the record might already exist if they retry
    const { error } = await supabase
      .from('telegram_auth_attempts')
      .upsert({
        session_id: sessionId,
        code: code,
        phone_number: contact.phone_number,
        telegram_id: contact.user_id?.toString() || chatId.toString(),
        full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins
        verified: false
      }, { onConflict: 'session_id' });

    if (error) {
      console.error('Supabase error:', error);
      bot.sendMessage(chatId, 'Sorry, there was an error processing your request. Please try again later.');
      return;
    }

    // 2. Clear from memory store
    sessionStore.delete(chatId);

    bot.sendMessage(chatId, `Thank you! Your verification code is:`);
    bot.sendMessage(chatId, `*${code}*`, { parse_mode: 'Markdown' });
    bot.sendMessage(chatId, `Enter this code on the website to complete your registration.`);
  } catch (err) {
    console.error('Unexpected error:', err);
    bot.sendMessage(chatId, 'An unexpected error occurred. Please try again.');
  }
});

console.log('Bot is running and listening for messages...');
