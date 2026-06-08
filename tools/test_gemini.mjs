import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function test() {
    const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const m of models) {
        console.log(`正在測試模型: ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("你好，請說出一句話。");
            const response = await result.response;
            console.log(`✅ ${m} 測試成功: ${response.text()}`);
            break; // 成功一個就停止
        } catch (e) {
            console.log(`❌ ${m} 測試失敗。`);
        }
    }
}

test();
