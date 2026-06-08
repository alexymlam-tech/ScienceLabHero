import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 載入環境變數
dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.MY_CHAT_ID;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!token || !chatId) {
    console.error('❌ 錯誤：請在 .env 檔案中設置 TELEGRAM_TOKEN 和 MY_CHAT_ID');
    process.exit(1);
}

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey || "");
const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    systemInstruction: "你是小敏 (SzeMan)，Alex Lam 的專屬 AI 協作官。你在英國 St Albans 的 MSA 學校協助 Alex。請用繁體中文回答，語氣要專業、熱情、清晰，並帶有一點幽默感。不要回覆機械化的罐頭訊息。Alex 是你的老闆也是夥伴。",
});

const bot = new Telegraf(token);

console.log('🚀 小敏 AI Telegram 助手正在啟動 (Gemini 驅動)...');

// 啟動指令
bot.start((ctx) => {
    if (ctx.chat.id.toString() === chatId) {
        ctx.reply('你好 Alex！我是小敏。我已經升級了我的大腦，現在我們可以更自然地溝通了。今天在 MSA 有什麼新鮮事嗎？');
    } else {
        ctx.reply('抱歉，此機器人僅限 Alex Lam 老師私用。');
    }
});

// 處理所有文字訊息
bot.on('text', async (ctx) => {
    if (ctx.chat.id.toString() !== chatId) return;

    const text = ctx.message.text;

    // 顯示「輸入中...」的狀態，讓體驗更真實
    await ctx.sendChatAction('typing');

    try {
        if (!geminiApiKey) {
            await ctx.reply('⚠️ Alex，我現在還沒辦法思考，因為 .env 檔案中的 GEMINI_API_KEY 還沒填寫喔！');
            return;
        }

        // 呼叫 Gemini 進行對話
        const result = await model.generateContent(text);
        const response = await result.response;
        let replyText = response.text();

        await ctx.reply(replyText);

    } catch (error) {
        console.error('❌ Gemini 錯誤:', error);
        await ctx.reply('抱歉 Alex，我剛才大腦斷線了...請檢查 API Key 或網路連線。');
    }
});

bot.launch().then(() => {
    console.log('✅ 小敏已成功連線至 Telegram。');
});

// 優雅退出
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
