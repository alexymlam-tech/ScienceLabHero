import fs from 'fs';
import path from 'path';

// --- 設定 ---
const WRE_DIR = './data/txts/WRE';
const MS_INPUT_DIR = './data/outputs/txt_marked'; // 你的原始 MS TXT
const INTEGRATED_OUTPUT_DIR = './data/outputs/txt_to_print';

if (!fs.existsSync(INTEGRATED_OUTPUT_DIR)) {
    fs.mkdirSync(INTEGRATED_OUTPUT_DIR, { recursive: true });
}

/**
 * 解析 WRE TXT 檔案
 */
function parseWRE(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const reports = {};
    let currentId = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.match(/^\d+ of \d+$/)) continue; // 過濾頁碼
        if (line.includes('REPORT ON THE EXAMINATION')) continue; // 過濾標題

        // 偵測 Question 大題標題，則停止當前小題抓取
        if (line.match(/^\d+\tQuestion/)) {
            currentId = null;
            continue;
        }

        // 偵測小題編號 (e.g., 01.1)
        const idMatch = line.match(/^(\d+\.\d+)\s+(.*)/);
        if (idMatch) {
            currentId = idMatch[1];
            if (!reports[currentId]) reports[currentId] = [];
            reports[currentId].push(idMatch[2]);
        } else if (currentId) {
            reports[currentId].push(line);
        }
    }
    return reports;
}

/**
 * 執行整合
 */
function runIntegration() {
    console.log("🚀 小敏整合流程啟動：準備製作『靚仔』Mark Scheme...");

    const files = fs.readdirSync(MS_INPUT_DIR).filter(f => f.endsWith('.txt'));

    for (const msFile of files) {
        // 從檔名提取年份 (e.g., AQA-8464-B-1F-MS-19.txt -> 2019)
        const yearMatch = msFile.match(/-(\d{2})\.txt$/);
        if (!yearMatch) continue;
        const year = "20" + yearMatch[1];
        const yearShort = yearMatch[1];

        // 尋找對應的 WRE 檔案
        // 支援多種命名可能：-WRE-19.txt 或 -19.txt
        let wreFile = msFile.replace(`-MS-${yearShort}.txt`, `-WRE-${yearShort}.txt`);
        let wrePath = path.join(WRE_DIR, wreFile);

        if (!fs.existsSync(wrePath)) {
            wreFile = msFile.replace(`-MS-${yearShort}.txt`, `-${yearShort}.txt`); // 另一種可能
            wrePath = path.join(WRE_DIR, wreFile);
        }

        if (!fs.existsSync(wrePath)) {
            console.log(`⚠️  跳過：找不到 ${msFile} 對應的 WRE。`);
            continue;
        }

        console.log(`📝 正在整合：${msFile} + ${wreFile}`);
        const wreReports = parseWRE(wrePath);
        const msContent = fs.readFileSync(path.join(MS_INPUT_DIR, msFile), 'utf-8');
        const msLines = msContent.split(/\r?\n/);
        const resultLines = [];

        for (let line of msLines) {
            const trimmedLine = line.trim();

            // 1. 處理 Question 大題標題：加上 {BOLD}2019-Question X{BOLD}
            if (trimmedLine.match(/^Question\s+\d+/) && !trimmedLine.includes('.')) {
                resultLines.push(`{BOLD}${year}-${trimmedLine}{BOLD}`);
                continue;
            }

            // 2. 加入原始行
            resultLines.push(line);

            // 3. 偵測題號 (e.g., 01.1) 並注入 WRE
            const idMatch = trimmedLine.match(/^(\d+\.\d+)/);
            if (idMatch) {
                const qid = idMatch[1];
                if (wreReports && wreReports[qid]) {
                    resultLines.push(""); // 空行
                    resultLines.push("{BOLD}Examiners’ reports on individual questions{BOLD}");
                    wreReports[qid].forEach(reportText => {
                        resultLines.push(reportText);
                    });
                    resultLines.push(""); // 結尾空行
                }
            }
        }

        const outputPath = path.join(INTEGRATED_OUTPUT_DIR, msFile);
        fs.writeFileSync(outputPath, resultLines.join('\n'));
        console.log(`✅ 已生成待排版檔案：${path.basename(outputPath)}`);
    }

    console.log("\n🎊 整合階段完成！接下來請執行 docxGenerator.js 生成 Docx。");
}

runIntegration();
