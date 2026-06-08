const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

async function getStaffBriefing() {
  const userDataDir = path.join(__dirname, 'user_data');
  const downloadPath = path.join(__dirname, 'downloads');

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }

  console.log("正在啟動瀏覽器並搜尋 Marie Moynihan 的 Staff Briefing...");

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: ['--start-maximized'],
    acceptDownloads: true
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    await page.goto('https://outlook.office.com/mail/');

    // 1. 搜尋 Marie Moynihan Staff Briefing
    const searchBox = await page.waitForSelector('input[placeholder="Search"]');
    await searchBox.click();
    await page.keyboard.type('from:"Marie Moynihan" "Staff Briefing"');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');

    console.log("正在搜尋郵件 (已改用鍵盤模擬輸入)...");
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'after_search.png' });

    // 2. 點擊最上面的一封郵件
    const firstEmail = await page.waitForSelector('div[role="option"]');
    await firstEmail.click();
    console.log("已點擊第一封郵件，等待內容加載...");
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'after_click.png' }); // 新增中間截圖

    // 3. 尋找附件並下載
    console.log("正在尋找附件...");
    const attachmentButton = await page.waitForSelector('button[aria-label*=".docx"]', { timeout: 30000 });

    // 監聽下載事件
    const downloadPromise = page.waitForEvent('download');
    await attachmentButton.click();

    // 處理下載彈窗（如果有的話，有時需要點擊「下載」按鈕）
    try {
        const downloadMenu = await page.waitForSelector('button[aria-label="Download"], span:has-text("Download")', { timeout: 30000 });
        await downloadMenu.click();
    } catch(e) {
        // 有些介面直接點擊附件就開始下載
    }

    const download = await downloadPromise;
    const filePath = path.join(downloadPath, download.suggestedFilename());
    await download.saveAs(filePath);
    console.log(`✅ 附件已下載至: ${filePath}`);

    // 4. 解析 Word 內容
    console.log("正在分析 Briefing 內容...");
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    console.log("\n=== 📝 今日 Staff Briefing 摘要報告 ===");
    console.log(text.substring(0, 1000) + "..."); // 先印出部分內容
    console.log("====================================\n");

    // 將內容存成文字檔供小敏後續詳讀
    fs.writeFileSync('briefing_content.txt', text);

  } catch (e) {
    console.log("執行失敗：", e.message);
    await page.screenshot({ path: 'briefing_error.png' });
  } finally {
    await context.close();
    process.exit();
  }
}

getStaffBriefing();
