/**
 * Science Lab Hero - Core Game Logic (v0.6.15)
 * Updated by SzeMan (小敏)
 * Changes: Robust leaderboard DOM rendering (using createElement instead of innerHTML).
 */

const FALLBACK_QUESTIONS = {
    "1": { "title": "🧬 Level 1: Organisms", "questions": [
        { "q": "Which part of a cell contains DNA?", "options": [{"text": "Nucleus", "correct": true}, {"text": "Cytoplasm", "correct": false}, {"text": "Wall", "correct": false}, {"text": "Vacuole", "correct": false}] },
        { "q": "Respiration happens in which part?", "options": [{"text": "Mitochondria", "correct": true}, {"text": "Nucleus", "correct": false}, {"text": "Ribosome", "correct": false}, {"text": "Membrane", "correct": false}] }
    ]}
};
for(let i=2; i<=11; i++) {
    if(!FALLBACK_QUESTIONS[i]) {
        FALLBACK_QUESTIONS[i] = {
            "title": i===11 ? "👹 BOSS LEVEL" : `Topic ${i} Lab`,
            "questions": [
                { "q": `Placeholder Question ${i}?`, "options": [{"text": "Correct", "correct": true}, {"text": "Wrong", "correct": false}, {"text": "Wrong", "correct": false}, {"text": "Wrong", "correct": false}] }
            ]
        };
    }
}

class AudioManager {
    constructor() {
        this.audioCtx = null; this.isMuted = false;
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) muteBtn.onclick = () => { this.isMuted = !this.isMuted; muteBtn.innerText = this.isMuted ? '🔇' : '🔊'; };
    }
    initCtx() { if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    playSFX(type) {
        this.initCtx(); if (this.isMuted) return;
        const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        if (type === 'success') {
            osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1046.50, this.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.3);
        } else {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(110, this.audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(55, this.audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.4);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.4);
        }
    }
}

class GameEngine {
    constructor() {
        this.level = 1; this.score = 0; this.lives = 3; this.db = null;
        this.currentQuestions = []; this.qIndex = 0; this.questionsPerLevel = 5;
        this.levelPerfect = true; this.audio = new AudioManager();
        this.heroID = localStorage.getItem('heroID') || ('H_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('heroID', this.heroID);
        this.ui = {
            level: document.getElementById('level-display'), score: document.getElementById('score-display'),
            lives: document.getElementById('lives-display'), content: document.getElementById('game-content'),
            startBtn: document.getElementById('start-btn'), startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'), leaderboardScreen: document.getElementById('leaderboard-screen'),
            finalScore: document.getElementById('final-score'), playerName: document.getElementById('player-name'),
            submitScoreBtn: document.getElementById('submit-score-btn'), leaderboardBody: document.getElementById('leaderboard-body'),
            viewLeaderboardBtn: document.getElementById('view-leaderboard-btn')
        };
        this.init();
    }

    async init() {
        if (this.ui.startBtn) { this.ui.startBtn.disabled = true; this.ui.startBtn.innerText = "Initializing..."; }
        try {
            const response = await fetch('questions.json?v=' + Date.now());
            if (!response.ok) throw new Error("CORS/Network");
            this.db = await response.json();
        } catch (error) {
            this.db = FALLBACK_QUESTIONS;
            this.showToast("Local Safe Mode Active", "info");
        }
        if (this.ui.startBtn) {
            this.ui.startBtn.disabled = false; this.ui.startBtn.innerText = "Start Game";
            this.ui.startBtn.addEventListener('click', () => {
                this.audio.initCtx(); this.ui.startScreen.style.display = 'none';
                this.startLevel(1);
            });
        }
        if (this.ui.viewLeaderboardBtn) {
            this.ui.viewLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        }
        if (this.ui.submitScoreBtn) {
            this.ui.submitScoreBtn.addEventListener('click', () => this.saveScore());
        }
    }

    formatDateTime(ts) {
        if (!ts) return "N/A";
        const d = new Date(ts);
        return d.toLocaleDateString('en-GB') + "; " + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    showToast(message, type = "info") {
        const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 500); }, 3000);
    }

    shuffle(array) { return [...array].sort(() => Math.random() - 0.5); }

    startLevel(lv) {
        this.level = lv; this.lives = 3; this.qIndex = 0; this.levelPerfect = true;
        const data = this.db[lv];
        if (!data) { this.showVictory(); return; }
        if (lv === 11) {
            const bossPool = [];
            for (let i = 1; i <= 10; i++) {
                if (this.db[i]) { const pool = this.db[i].questions; bossPool.push(pool[Math.floor(Math.random() * pool.length)]); }
            }
            this.currentQuestions = this.shuffle(bossPool).slice(0, 10);
            this.showToast("👹 BOSS LEVEL START!", "info");
        } else {
            this.currentQuestions = this.shuffle(data.questions).slice(0, this.questionsPerLevel);
        }
        this.renderQuestion(); this.updateUI();
    }

    renderQuestion() {
        this.ui.content.innerHTML = '';
        const currentQ = this.currentQuestions[this.qIndex];
        if (!currentQ) { this.startLevel(this.level + 1); return; }

        const title = document.createElement('h2'); title.innerText = (this.level === 11) ? "👹 BOSS LEVEL" : this.db[this.level].title;
        this.ui.content.appendChild(title);
        const qText = document.createElement('p'); qText.className = "question-text"; qText.innerText = currentQ.q;
        this.ui.content.appendChild(qText);
        const optionsContainer = document.createElement('div'); optionsContainer.className = "options-container";
        this.shuffle(currentQ.options).forEach(opt => {
            const btn = document.createElement('button'); btn.className = "choice-btn"; btn.innerText = opt.text;
            btn.onclick = () => this.handleAnswer(opt, btn);
            optionsContainer.appendChild(btn);
        });
        this.ui.content.appendChild(optionsContainer);
    }

    handleAnswer(opt, btn) {
        const buttons = this.ui.content.querySelectorAll('.choice-btn');
        buttons.forEach(b => b.disabled = true);
        if (opt.correct) {
            btn.classList.add('correct-ans'); this.audio.playSFX('success');
            this.score += (this.level === 11 ? 500 : 100); this.updateUI();
            setTimeout(() => {
                this.qIndex++;
                if (this.qIndex >= this.currentQuestions.length) {
                    if (this.level >= 11) { this.showVictory(); }
                    else { this.showToast(`Level ${this.level} Passed!`, "success"); this.startLevel(this.level + 1); }
                } else { this.renderQuestion(); }
            }, 800);
        } else {
            btn.classList.add('wrong-ans'); this.audio.playSFX('fail');
            this.lives--; this.levelPerfect = false; this.updateUI();
            if (this.lives <= 0) {
                this.showToast("💔 CRITICAL FAILURE!", "fail");
                setTimeout(() => this.triggerGameOver(), 1000);
            } else {
                this.showToast(`Incorrect! ${this.lives} left.`, "fail");
                setTimeout(() => { buttons.forEach(b => b.disabled = false); btn.classList.remove('wrong-ans'); }, 800);
            }
        }
    }

    updateUI() {
        if (this.ui.level) this.ui.level.innerText = (this.level === 11 ? "BOSS" : this.level);
        if (this.ui.score) this.ui.score.innerText = this.score;
        if (this.ui.lives) this.ui.lives.innerText = "❤️".repeat(this.lives);
    }

    triggerGameOver() {
        this.ui.startScreen.style.display = 'none'; this.ui.content.innerHTML = '';
        this.ui.gameOverScreen.style.display = 'flex';
        this.ui.finalScore.innerText = this.score;
    }

    async saveScore() {
        const name = this.ui.playerName.value.trim() || "Anonymous Hero";
        this.ui.submitScoreBtn.disabled = true; this.ui.submitScoreBtn.innerText = "Syncing...";

        const uniqueKey = encodeURIComponent(name) + "_" + this.heroID;
        const timeout = new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 5000));

        try {
            const ref = database.ref('leaderboard/' + uniqueKey);
            const snap = await Promise.race([ref.once('value'), timeout]);
            const existing = snap.val();
            const newScore = Number(this.score);
            const oldScore = existing ? Number(existing.score) : 0;

            if (existing && oldScore >= newScore) {
                this.showToast("Score not higher than personal best!", "info");
            } else {
                await Promise.race([
                    ref.set({ name, score: newScore, level: this.level, timestamp: Date.now() }),
                    timeout
                ]);
            }
            this.showLeaderboard();
        } catch (e) {
            console.error("Submission failed:", e);
            this.showToast("Sync Failed - Showing Local Board", "fail");
            this.showLeaderboard();
        }
    }

    async showLeaderboard() {
        this.ui.startScreen.style.display = 'none';
        this.ui.gameOverScreen.style.display = 'none';
        this.ui.leaderboardScreen.style.display = 'flex';
        this.ui.leaderboardBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

        try {
            console.log("[DEBUG] Fetching from Firebase path: /leaderboard");
            const ref = database.ref('/leaderboard');

            // 加入連線狀態偵測
            const snap = await ref.once('value');

            // 檢查是否存在資料
            if (!snap.exists()) {
                console.warn("[DEBUG] No data found at /leaderboard");
                this.ui.leaderboardBody.innerHTML = '<tr><td colspan="5">No entries yet</td></tr>';
                return;
            }

            const data = [];
            snap.forEach(c => {
                const val = c.val();
                console.log("[DEBUG] Found entry:", val);
                data.push({
                    name: val.name || "Unknown",
                    score: Number(val.score) || 0,
                    level: val.level || '-',
                    timestamp: val.timestamp || 0
                });
            });

            console.log(`[DEBUG] Successfully fetched ${data.length} entries.`);
            data.sort((a, b) => b.score - a.score);
            const top10 = data.slice(0, 10);

            // 確保目標元素正確
            const tbody = this.ui.leaderboardBody;
            tbody.innerHTML = ''; // 清空

            top10.forEach((e, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${i+1}</td><td>${e.name}</td><td>${e.score}</td><td>${e.level}</td><td>${this.formatDateTime(e.timestamp)}</td>`;
                tbody.appendChild(tr);
            });
            console.log("[DEBUG] Rendering complete.");
        } catch (e) {
            console.error("[ERROR] Leaderboard fetch failed:", e); // Fail Loud
            this.ui.leaderboardBody.innerHTML = '<tr><td colspan="5">Error: ' + e.message + '</td></tr>';
        }
    }

    showVictory() {
        this.showToast("🏆 ALL LABS CLEARED!", "success");
        setTimeout(() => this.triggerGameOver(), 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new GameEngine(); });
