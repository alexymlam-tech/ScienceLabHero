const { chromium } = require('playwright');
const path = require('path');

async function login() {
  const userDataDir = path.join(__dirname, 'user_data');
  console.log(`正在啟動持久化瀏覽器 (資料夾: ${userDataDir})...`);

  // 使用 launchPersistentContext 而不是普通的 context
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--start-maximized']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  try {
    console.log("前往 Outlook...");
    await page.goto('https://outlook.office.com/mail/', { waitUntil: 'networkidle' });

    console.log("請完成登入。如果你之前登入過且資料夾有效，它應該會自動跳過登入。");

    // 等待進入收件匣
    await page.waitForSelector('[data-testid="CustomScrollbar"]', { timeout: 0 });
    console.log("✅ 已進入收件匣！");

    console.log("現在 Session 會自動儲存在 user_data 資料夾中。");

  } catch (err) {
    console.error("❌ 發生錯誤:", err);
  } finally {
    console.log("\n請在終端機按 Enter 鍵來關閉瀏覽器...");
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    await context.close();
    process.exit();
  }
}

login();
