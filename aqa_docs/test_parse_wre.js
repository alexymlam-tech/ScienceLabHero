import fs from 'fs';

function parseWRE(filePath, year) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const reports = {};
    let currentQuestion = null;
    let currentId = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // 過濾頁碼和固定標題
        if (line.match(/^\d+ of \d+$/)) continue;
        if (line.includes('REPORT ON THE EXAMINATION')) continue;

        // 偵測大題標題 (e.g., Question 1 (low demand))
        const qMatch = line.match(/^(\d+)\t(Question \d+.*)/);
        if (qMatch) {
            currentQuestion = `${year}-${qMatch[2]}`;
            // 這裡我們不存入 reports，但可以用來當作 context
            continue;
        }

        // 偵測小題編號 (e.g., 01.1)
        const idMatch = line.match(/^(\d+\.\d+)\s+(.*)/);
        if (idMatch) {
            currentId = idMatch[1];
            if (!reports[currentId]) reports[currentId] = [];
            reports[currentId].push(idMatch[2]);
        } else if (currentId) {
            // 如果沒有題號但前面已經有題號了，這行是上一題的後續段落
            reports[currentId].push(line);
        }
    }
    return { reports, currentQuestion };
}

// 測試解析
const testResult = parseWRE('./data/txts/WRE/AQA-8464-B-1F-WRE-18.txt', '2018');
console.log(JSON.stringify(testResult, null, 2));
