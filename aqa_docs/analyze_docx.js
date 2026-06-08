const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function analyzeLatestDocx() {
  const downloadDir = path.join(__dirname, 'downloads');

  // 1. 取得最新下載的 .docx 檔案
  const files = fs.readdirSync(downloadDir)
    .filter(f => f.endsWith('.docx'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(downloadDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.log("❌ downloads/ 目錄中沒有找到 .docx 檔案。");
    return;
  }

  const latestFile = files[0].name;
  const filePath = path.join(downloadDir, latestFile);
  console.log(`🔍 正在分析最新檔案：${latestFile}`);

  try {
    // 2. 使用 mammoth 提取文字
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    console.log("\n--- 提取內容摘要 (前 500 字) ---");
    console.log(text.substring(0, 500) + "...");
    console.log("------------------------------\n");

    console.log("✅ 內容提取成功！");
    console.log("提示：你可以將這些內容貼給 Claude，讓我幫你做重點摘要與分析。");

  } catch (e) {
    console.log("❌ 分析失敗：", e.message);
  }
}

analyzeLatestDocx();
