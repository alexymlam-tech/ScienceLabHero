import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 取得當前目錄路徑
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.MY_CHAT_ID;

if (!token || !chatId) {
    process.exit(0); // 靜默退出，避免啟動時報錯干擾
}

const bot = new Telegraf(token);

async function main() {
    try {
        await bot.telegram.sendMessage(chatId, '🚀 **小敏已在本地端啟動！**\n\nAlex 老師，我已準備好協助你處理 MSA 的教學事務。', {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        // 忽略錯誤
    } finally {
        process.exit(0);
    }
}

main();
