import fs from 'fs';
import path from 'path';

const WRE_DIR = './data/txts/WRE';
const MS_DIR = './data/outputs/txt_marked';
const OUTPUT_DIR = './data/outputs/txt_with_wre';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseWRE(filePath, year) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const reports = {};
    let currentId = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // 過濾頁碼和固定標題
        if (line.match(/^\d+ of \d+$/)) continue;
        if (line.includes('REPORT ON THE EXAMINATION')) continue;

        // 偵測大題標題 - 如果遇到新的 Question，終止當前小題抓取
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

function integrate() {
    console.log("🚀 小敏 WRE 整合引擎啟動...");

    // 取得所有 MS 檔案
    const msFiles = fs.readdirSync(MS_DIR).filter(f => f.endsWith('.txt'));

    for (const msFile of msFiles) {
        // 假設檔名格式為 AQA-8464-B-1F-MS-18.txt
        // 對應的 WRE 檔名應為 AQA-8464-B-1F-WRE-18.txt
        const wreFile = msFile.replace('-MS-', '-WRE-');
        const wrePath = path.join(WRE_DIR, wreFile);
        const year = "2018"; // 這裡可以從檔名提取，暫時寫死 2018

        if (!fs.existsSync(wrePath)) {
            console.log(`⚠️ 找不到對應的 WRE 檔案：${wreFile}，跳過。`);
            continue;
        }

        console.log(`📦 正在整合：${msFile} <-> ${wreFile}`);
        const wreReports = parseWRE(wrePath, year);
        const msContent = fs.readFileSync(path.join(MS_DIR, msFile), 'utf-8');
        const msLines = msContent.split(/\r?\n/);
        const resultLines = [];

        for (let line of msLines) {
            resultLines.push(line);

            // 偵測 MS 中的大題標題 (例如 Question 1)
            const qHeaderMatch = line.match(/Question\s+(\d+)/i);
            if (qHeaderMatch && !line.includes('.')) {
                // 在標題行修改，加上年份 (這部分可能要在 docxGenerator 處理，或者這裡直接改文字)
                // 根據範例：2018-Question 1 (low demand)
                // 但 MS txt 可能只有 Question 1
                // 我們嘗試在下一行補上資訊
            }

            // 偵測 MS 中的題號 (例如 01.1)
            const idMatch = line.match(/^(\d+\.\d+)/);
            if (idMatch) {
                const id = idMatch[1];
                if (wreReports[id]) {
                    resultLines.push(""); // 空行
                    resultLines.push("{BOLD}Examiners’ reports on individual questions{BOLD}");
                    wreReports[id].forEach(reportLine => {
                        resultLines.push(reportLine);
                    });
                    resultLines.push(""); // 結束後加空行
                }
            }
        }

        fs.writeFileSync(path.join(OUTPUT_DIR, msFile), resultLines.join('\n'));
        console.log(`✅ 整合完成：${msFile}`);
    }
}

integrate();
