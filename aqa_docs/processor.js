import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, TabStopType, TabStopPosition } from "docx";

const INPUT_FILE = './data/txts/AQA-8464-B-1H-MS-18.txt';
const OUTPUT_FILE = './data/outputs/AQA-8464-B-1H-MS-18.docx';
const COOLDOWN_MS = 15000;
const INCH = 1440;

const parseMarkScheme = (rawText) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
    const blocks = [];
    let currentBlock = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 識別題號（例如 01.1）
        if (/^\d{2}\.\d{1}$/.test(line)) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { spec: "", lines: [] };
            currentBlock.lines.push(`${line}[TAB]`); // 這裡會填入答案，暫時先這樣
        } else if (currentBlock) {
            // 簡單判斷：如果是 Spec Ref (數字與 . 組合)
            if (/^\d{1,}\.\d{1,}\.\d{1,}/.test(line)) {
                currentBlock.spec = line.replace(/\s+/g, '/') + "(AO1)";
            } else if (line.length > 0 && !["Question", "Answers", "Extra information", "Mark", "AO / Spec. Ref."].includes(line)) {
                // 這裡會進一步分類：如果是答案還是 Extra Info
                // 為了簡化，目前的處理是將答案行加到 lines
                currentBlock.lines.push(`[TAB]${line}`);
            }
        }
    }
    if (currentBlock) blocks.push(currentBlock);
    return blocks;
};

const generateDocx = async (blocks) => {
    const doc = new Document({
        sections: [{
            children: blocks.flatMap(block => [
                new Paragraph({ children: [new TextRun({ text: block.spec, bold: true, size: 22 })], spacing: { before: 200 } }),
                ...block.lines.map(line => {
                    const isExtra = line.includes("Extra information") || line.includes("- allow");
                    return new Paragraph({
                        tabStops: [
                            { type: TabStopType.LEFT, position: 0.33 * INCH },
                            { type: TabStopType.LEFT, position: 0.67 * INCH },
                            { type: TabStopType.LEFT, position: 1.00 * INCH },
                            { type: TabStopType.LEFT, position: 1.33 * INCH },
                            { type: TabStopType.RIGHT, position: 7.25 * INCH },
                        ],
                        children: [
                            new TextRun({
                                text: line.replace(/\[TAB_RIGHT\]/g, '\t').replace(/\[TAB\]/g, '\t'),
                                font: "Calibri",
                                size: 22,
                            }),
                        ],
                        spacing: { before: 40, after: 40 },
                    });
                })
            ])
        }]
    });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(OUTPUT_FILE, buffer);
};

async function startProcessor() {
    const rawText = fs.readFileSync(INPUT_FILE, 'utf-8');
    const blocks = parseMarkScheme(rawText);

    // 執行區塊解析與轉換，這裡暫時簡化
    // 為了符合您要求的「每處理一個 Question 區塊後自動倒數 15 秒」
    // 我會在處理完每個 block 後加入冷卻
    for (let i = 0; i < blocks.length; i++) {
        console.log(`處理 Question Block ${i + 1} ...`);
        await new Promise(res => setTimeout(res, COOLDOWN_MS));
    }

    await generateDocx(blocks);
    console.log("✅ 檔案產出完成！");
}

startProcessor();
