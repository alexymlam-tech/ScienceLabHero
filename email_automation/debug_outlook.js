const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: 'session.json' });
  const page = await context.newPage();

  await page.goto('https://outlook.office.com/mail/');

  // 等待幾秒讓網頁載入
  await page.waitForTimeout(10000); // 增加等待時間

  console.log("網頁標題:", await page.title());
  await page.screenshot({ path: 'outlook_debug.png' });

  await browser.close();
}
debug();
