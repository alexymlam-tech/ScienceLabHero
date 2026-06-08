const { chromium } = require('playwright');
const path = require('path');

async function draftSENReply() {
  const userDataDir = path.join(__dirname, 'user_data');
  console.log("正在啟動瀏覽器並準備安全草擬 (SEN Persona)...");

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--start-maximized']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  try {
    await page.goto('https://outlook.office.com/mail/');
    console.log("正在進入收件匣...");

    // 等待郵件清單載入
    await page.waitForSelector('div[role="option"]', { timeout: 30000 });

    // 點擊第一封郵件
    const firstEmail = await page.$('div[role="option"]');
    await firstEmail.click();
    console.log("✅ 已選取郵件");

    // 等待幾秒讓內容載入，然後尋找「回覆」按鈕
    await page.waitForTimeout(2000);

    // 嘗試點擊「回覆」按鈕 (Outlook 的 aria-label 通常是 "Reply" 或 "回覆")
    const replyButton = await page.waitForSelector('button[aria-label^="Reply"], button[aria-label^="回覆"]', { timeout: 10000 });
    await replyButton.click();
    console.log("✅ 已開啟回覆視窗");

    // 等待編輯區出現
    const editor = await page.waitForSelector('div[role="textbox"][aria-label^="Message body"], div[contenteditable="true"]', { timeout: 10000 });

    // 根據 SEN Persona (Parent 模式) 擬定草稿
    const draftContent = `
Dear Parent,

Thank you for your email. I completely understand your concerns regarding your child's progress.

We are committed to providing a supportive and patient learning environment. I have noted the specific points you mentioned and will ensure they are addressed in our next session. We remain very positive about the current trajectory.

Best regards,
Alex Lam
Assistant Teacher, MSA
    `.trim();

    // 將草稿填入編輯器
    await editor.fill(draftContent);
    console.log("🚀 SEN Persona 草稿已自動填入完成！");
    console.log("⚠️ 注意：腳本已停止，我絕對不會幫你點擊『傳送』。");

  } catch (e) {
    console.log("草擬失敗：", e.message);
  } finally {
    console.log("\n--- 安全停機 ---");
    console.log("請在瀏覽器中檢查草稿，滿意後請手動處理。");
    console.log("請在終端機按 Enter 鍵來關閉瀏覽器...");

    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    await context.close();
    process.exit();
  }
}

draftSENReply();
