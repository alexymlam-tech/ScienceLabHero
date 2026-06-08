const { chromium } = require('playwright');
const path = require('path');

async function listEmails() {
  const userDataDir = path.join(__dirname, 'user_data');
  console.log("正在啟動瀏覽器並檢查收件匣...");

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // 保持看得見，確保穩定性
    args: ['--start-maximized']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  try {
    await page.goto('https://outlook.office.com/mail/');

    console.log("等待頁面載入中...");
    // 等待搜尋框或收件匣清單出現
    await Promise.race([
      page.waitForSelector('input[placeholder="Search"]', { timeout: 30000 }),
      page.waitForSelector('[role="main"]', { timeout: 30000 })
    ]);

    console.log("✅ 偵測到 Outlook 介面。");
    await page.waitForTimeout(2000); // 額外等兩秒確保列表渲染

    const emails = await page.$$eval('div[aria-label^="Unread"], div[aria-label^="Read"], div[aria-label*="Staff book club"]', nodes => {
      return nodes.slice(0, 5).map(node => node.getAttribute('aria-label') || node.innerText);
    });

    console.log("\n=== 📬 你的最近 5 封郵件清單 ===");
    if (emails.length === 0) {
      console.log("未能解析郵件內容，但頁面已成功載入。");
    } else {
      emails.forEach((mail, i) => {
        const clean = mail.split('\n')[0].replace(/Received.*|Flagged.*|Unread.*|Read.*/g, '').trim();
        console.log(`${i + 1}. ${clean}`);
      });
    }
    console.log("==============================\n");

  } catch (e) {
    console.log("讀取失敗：", e.message);
  } finally {
    console.log("測試結束。按 Enter 關閉瀏覽器...");
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    await context.close();
    process.exit();
  }
}

listEmails();
