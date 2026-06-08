import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType, LeaderType, PageNumber, Footer } from "docx";

// --- 精確參數設定 ---
const INPUT_DIR = fs.existsSync('./data/outputs/txt_to_print') ? './data/outputs/txt_to_print' : './data/outputs/txt_marked';
const OUTPUT_DIR = './data/outputs/docx';
const INCH = 1440; // Word 單位 Twips (1 inch = 1440 twips)

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 處理包含 {BOLD} 標籤的文字，回傳 TextRun 陣列
 * 改進點：精確將 \t 轉換為 Word 的 Tab 元素
 */
function parseTextWithBold(text, defaultFont = "Calisto MT", defaultSize = 28, forceBold = false) {
    const runs = [];

    // 使用正則拆分 {BOLD}內容{BOLD}
    const parts = text.split(/({BOLD}.*?{BOLD})/g);

    for (const part of parts) {
        let isBold = forceBold;
        let content = part;

        if (part.startsWith('{BOLD}') && part.endsWith('{BOLD}')) {
            content = part.replace(/{BOLD}/g, '');
            isBold = true;
        }

        if (!content) continue;

        // 處理內容中的 Tab。將 "\t" 拆分為獨立的 TextRun，docx 會將其轉為 <w:tab/>
        const subParts = content.split(/(\t)/);
        for (const sp of subParts) {
            if (sp === '\t') {
                runs.push(new TextRun({
                    children: ["\t"],
                    font: defaultFont,
                    size: defaultSize,
                    bold: isBold
                }));
            } else if (sp) {
                runs.push(new TextRun({
                    text: sp,
                    font: defaultFont,
                    size: defaultSize,
                    bold: isBold
                }));
            }
        }
    }
    return runs;
}

async function runConversion() {
    console.log("🖨️ 小敏排版引擎 V5：自動奇偶頁碼與精確邊距模式...");

    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.txt'));

    for (const file of files) {
        console.log(`📄 正在排版：${file}`);
        const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8');

        const doc = new Document({
            evenAndOddHeaderFooter: true, // 開啟奇偶頁不同
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 720,
                            bottom: 720,
                            left: 720,
                            right: 720,
                            header: 504, // 0.35 inch
                            footer: 504, // 0.35 inch
                        },
                    },
                },
                footers: {
                    default: new Footer({ // 奇數頁
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({ text: "P.", font: "Calisto MT", size: 28 }),
                                    new TextRun({ children: [PageNumber.CURRENT], font: "Calisto MT", size: 28 }),
                                ],
                            }),
                        ],
                    }),
                    even: new Footer({ // 偶數頁
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [
                                    new TextRun({ text: "P.", font: "Calisto MT", size: 28 }),
                                    new TextRun({ children: [PageNumber.CURRENT], font: "Calisto MT", size: 28 }),
                                ],
                            }),
                        ],
                    }),
                },
                children: content.split('\n').map(line => {
                    const rawLine = line.trim();
                    if (!rawLine) return new Paragraph({ children: [] });

                    // 先處理標籤轉換為實體 Tab
                    let cleanLine = line.replace(/{TAB}/g, '\t').replace(/{TAB_RIGHT}/g, '\t');

                    // 處理右對齊標籤 {ALIGN RIGHT}
                    let alignment = AlignmentType.BOTH;
                    if (cleanLine.includes('{ALIGN RIGHT}')) {
                        alignment = AlignmentType.RIGHT;
                        cleanLine = cleanLine.replace(/{ALIGN RIGHT}/g, '');
                    }

                    // 判斷是否為 Spec Header
                    const isSpecHeader = cleanLine.trim().match(/^(\d+\.){2,}/) || cleanLine.includes('AO');
                    let children = [];

                    // 分離題號 (例如 01.1) 與後續內容
                    const qMatch = cleanLine.match(/^(\d+)\.(\d+)(.*)/);

                    if (qMatch && !isSpecHeader) {
                        const major = qMatch[1];
                        const minor = qMatch[2];
                        const rest = qMatch[3];

                        // 題號使用特殊字體，點號使用 Calisto MT
                        children.push(new TextRun({ text: major, font: "RatcapsPCW95-Regular", size: 28 }));
                        children.push(new TextRun({ text: ".", font: "Calisto MT", size: 28 }));
                        children.push(new TextRun({ text: minor, font: "RatcapsPCW95-Regular", size: 28 }));

                        // 剩餘內容解析
                        children.push(...parseTextWithBold(rest, "Calisto MT", 28));
                    } else {
                        // 自動加粗 "Extra information"
                        const forceBold = cleanLine.includes('Extra information');
                        children.push(...parseTextWithBold(cleanLine, "Calisto MT", 28, forceBold));
                    }

                    return new Paragraph({
                        alignment: alignment,
                        tabStops: [
                            { type: TabStopType.LEFT, position: 475 },
                            { type: TabStopType.LEFT, position: 965 },
                            { type: TabStopType.LEFT, position: 1440 },
                            { type: TabStopType.LEFT, position: 1915 },
                            { type: TabStopType.RIGHT, position: 10440, leader: LeaderType.DOT },
                        ],
                        indent: {
                            left: 1440,
                            hanging: 1440,
                        },
                        snapToGrid: false,
                        children: children
                    });
                }),
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        const outputFileName = file.replace('.txt', '.docx');
        fs.writeFileSync(path.join(OUTPUT_DIR, outputFileName), buffer);
        console.log(`✅ 已生成：${outputFileName}`);
    }
    console.log("\n🎊 引擎 V5 升級完成！「Learn from the best of others, be the best of yourself.」");
}

runConversion().catch(err => console.error("❌ 發生錯誤：", err));
