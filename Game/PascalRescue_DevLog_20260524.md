# Dev Log: Math Adventure & Pascal Rescue (2026-05-24)

## 1. Math Sense Adventure (v1.9.5)
*   **功能驗證**：確認 `Reg Group` 輸入欄位已在 HTML 與 JS 中完整實作，玩家提交分數時會附帶班別資訊。
*   **雲端整合**：`game.js` 已預留 Google Sheets 提交邏輯，待填入 `GOOGLE_SCRIPT_URL` 即可啟用。

## 2. The Rescue of Pascal Building (New Project)
*   **基礎架構**：完成 `index.html`, `style.css`, `main.js` 初始化。
*   **地圖系統**：實作 Floor 1 藍圖，包含 101, 102, 103 教室。
*   **課程內容**：
    *   101: Powers of 10 & Multiples (Mr. Jones)
    *   102: Factors & Prime Numbers (Ms. Smith)
    *   103: Estimation & Rounding (Mr. Lee)
*   **趣味視覺**：
    *   在地圖教室中加入「囚禁的老師」圖示（帶有鐵籠效果）。
    *   戰鬥畫面中，老師會出現在魔王身邊求救。
    *   勝利畫面會展示獲救老師的專屬頭像。
*   **相容性修正**：為解決本地端開啟 `index.html` 時按鈕失效的問題，已將專案從 ES6 Modules 改回「普通腳本（No-Module Version）」，並內嵌關卡資料，確保在任何瀏覽器直接開啟都能遊玩。
*   **進度保存**：實作 `localStorage` 系統，自動儲存獲救老師的徽章數。

## 3. 待辦事項 (Pending)
*   填入 Google Apps Script URL 以測試 MSA 的成績收集功能。
*   (選填) 增加 Floor 2: Algebra 或 Floor 3: Ratio 的關卡內容。

---
**小敏報點：** 所有檔案已儲存於 `C:\Users\Lam\Desktop\SzeMan\MathAdventure\PascalRescue`。
"Learn from the best of others, be the best of yourself!"
