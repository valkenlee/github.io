/* =============================================================
   📌 (Last Updated: 2026-08-31) - v0.4 Multi-language
   ============================================================= */
const APP_VERSION = "0.4.0";
console.log(`[App Initialized] Version: ${APP_VERSION}`);

let zipInstance = null;
const tileSvgCache = {};

const SUITS = [
    { code: 'Man', name: '만자패' },
    { code: 'Pin', name: '통자패' },
    { code: 'Sou', name: '삭자패' }
];

let currentSuitObj = null;
let currentHand = [];
let winningTiles = [];
let maxedOutWinningTiles = [];
let winningDecompositions = {}; 
let isChiitoiHand = false;     
let isRyanpeikouHand = false; 
let selectedTiles = new Set();

let currentMode = 'normal';
let isSubmitted = false;

let streakCount = 0;
let timerInterval = null;
let timeLeft = 60;
let pendingRecordStreak = 0;

// 🔒 히든 모드 변수
let titleClickCount = 0;
let titleClickTimer = null;
let customHand = [];
let customSuitCode = 'Man';

window.addEventListener('DOMContentLoaded', async () => {
    // 🌐 언어 선택 드롭다운 UI 동기화
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = currentLang;
    applyTranslations();

    loadLeaderboard(); 
    initTitleClickTrigger();
    renderCustomButtons();
    
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT') return;
        if (e.key >= '1' && e.key <= '9') {
            if (isSubmitted) return; 
            const num = parseInt(e.key);
            const btn = document.getElementById(`btn-num-${num}`);
            if (btn) toggleSelect(num, btn);
        } else if (e.key === 'Enter') {
            handleSubmitOrNext();
        }
    });

    try {
        const response = await fetch('Regular.zip');
        if (!response.ok) throw new Error('Regular.zip 파일을 찾을 수 없습니다.');
        
        const arrayBuffer = await response.arrayBuffer();
        zipInstance = await JSZip.loadAsync(arrayBuffer);
        
        const statusMsg = document.getElementById('status-msg');
        statusMsg.style.color = '#27ae60';
        statusMsg.innerText = t('loadingSuccess');
        
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);
    } catch (err) {
        const statusMsg = document.getElementById('status-msg');
        statusMsg.style.color = '#e74c3c';
        statusMsg.innerText = t('loadingError');
        console.error(err);
    }
});

// ==========================================
// Google Apps Script API 설정
// ==========================================
const GAS_CONFIG = {
    apiUrl: "https://script.google.com/macros/s/AKfycbw7IDyRIqGfps_5Yw7az-9_vPXajFKR-rZaCHpFeBA3sVsnExFFmK70cfxr_Der58RJvA/exec",
    secretKey: "Mahjong_Quiz_Secret_Key_2026",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTnJU4yDCDyeZZCmpkbogFP62WF_AcmsitYv6YBufHxY2qafrzmqXjvOHUrAsGp0sjeK-FBAptasrpq/pub?gid=1559316332&single=true&output=csv"
};

/* -------------------------------------------------------------
   📊 HMAC 서명 생성 및 Apps Script 기록 저장
------------------------------------------------------------- */
function saveRecord() {
    const inputElem = document.getElementById('player-name-input');
    const saveBtn = document.getElementById('btn-save-record');
    let playerName = inputElem.value.trim();
    
    if (!playerName) playerName = 'Anonymous';

    saveBtn.disabled = true;
    saveBtn.innerText = '...';

    const timestamp = Date.now();
    const streak = pendingRecordStreak;

    const rawMessage = `${playerName}_${streak}_${timestamp}`;
    const signature = CryptoJS.HmacSHA256(rawMessage, GAS_CONFIG.secretKey).toString(CryptoJS.enc.Hex);

    const payload = {
        name: playerName,
        streak: streak,
        timestamp: timestamp,
        signature: signature
    };

    fetch(GAS_CONFIG.apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.result === 'success') {
            alert(`🎉 ${playerName} (${streak}) - OK!`);
            document.getElementById('name-input-container').style.display = 'none';
            inputElem.value = '';
            setTimeout(loadLeaderboard, 1500);
        } else {
            alert(`⚠️ Error: ${data.message || 'Error'}`);
        }
    })
    .catch(err => {
        alert('Network Error');
        console.error(err);
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerText = t('btnSaveRecord');
    });
}

/* -------------------------------------------------------------
   📊 구글 시트 실시간 리더보드 조회
------------------------------------------------------------- */
function loadLeaderboard() {
    if (!GAS_CONFIG.csvUrl || GAS_CONFIG.csvUrl.includes('YOUR_SHEET_ID')) {
        document.getElementById('record-list-ul').innerHTML = 
            '<li style="text-align:center; padding:10px; color:#e74c3c;">CSV URL Setting Required</li>';
        return;
    }

    const fetchUrl = `${GAS_CONFIG.csvUrl}&t=${Date.now()}`;

    Papa.parse(fetchUrl, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: function(results) {
            const rows = results.data;
            const userRecordsMap = new Map();

            rows.forEach((row) => {
                if (!row || row.length < 3) return;

                let rawTimestamp = String(row[0] || '').trim();
                let name = String(row[1] || '').trim();
                let streak = parseInt(row[2], 10);

                if (rawTimestamp.includes('타임스탬프') || rawTimestamp.includes('Timestamp') || name.includes('Name') || isNaN(streak)) return;
                if (!name) name = 'Anonymous';

                if (streak >= 10) {
                    const formattedDate = formatTimestamp(rawTimestamp);
                    const dateOnly = formattedDate.split(' ')[0] || formattedDate;
                    const uniqueKey = `${name}_${dateOnly}`;
                    
                    if (userRecordsMap.has(uniqueKey)) {
                        if (streak > userRecordsMap.get(uniqueKey).streak) {
                            userRecordsMap.set(uniqueKey, { name, streak, date: formattedDate });
                        }
                    } else {
                        userRecordsMap.set(uniqueKey, { name, streak, date: formattedDate });
                    }
                }
            });

            let parsedRecords = Array.from(userRecordsMap.values());
            parsedRecords.sort((a, b) => b.streak - a.streak);

            const top10 = parsedRecords.slice(0, 10);
            const ul = document.getElementById('record-list-ul');
            ul.innerHTML = '';

            if (top10.length === 0) {
                ul.innerHTML = '<li style="text-align:center; padding: 10px; color:#7f8c8d;">No records found.</li>';
                return;
            }

            top10.forEach((rec, idx) => {
                const li = document.createElement('li');
                li.className = 'record-item';
                li.innerHTML = `
                    <span class="record-rank">${idx + 1}</span>
                    <span class="record-name">${escapeHtml(rec.name)}</span>
                    <span class="record-score">${rec.streak}</span>
                    <span class="record-date" style="font-size: 11px; color: #888; white-space: nowrap;">${rec.date}</span>
                `;
                ul.appendChild(li);
            });
        },
        error: function(err) {
            console.error("Leaderboard error:", err);
        }
    });
}

function formatTimestamp(rawStr) {
    if (!rawStr) return '-';
    let str = String(rawStr).trim();
    try {
        let isPM = str.includes('오후');
        let cleaned = str.replace(/(오전|오후)/g, '').trim();
        let parts = cleaned.split(/[\s.:-]+/).filter(Boolean);

        if (parts.length >= 3) {
            let year = parts[0];
            let month = String(parts[1]).padStart(2, '0');
            let day = String(parts[2]).padStart(2, '0');
            let hour = parseInt(parts[3] || '0', 10);
            let min = String(parts[4] || '0').padStart(2, '0');
            let sec = String(parts[5] || '0').padStart(2, '0');

            if (isPM && hour < 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;

            let hourStr = String(hour).padStart(2, '0');
            return `${year}-${month}-${day} ${hourStr}:${min}:${sec}`;
        }
    } catch (e) {
        console.warn(e);
    }
    return str;
}

/* -------------------------------------------------------------
   🔒 히든 패 분석기
------------------------------------------------------------- */
function isWrappedEnvironment() {
    return Boolean(
        window.__IS_WRAPPED__ === true ||
        window.location.href.includes('wrapped=true') ||
        Array.from(document.scripts).some(s => s.src && s.src.includes('wrapped=true'))
    );
}

function initTitleClickTrigger() {
    const mainTitle = document.getElementById('title-icon');
    if (!mainTitle) return;

    mainTitle.addEventListener('click', () => {
        if (!isWrappedEnvironment()) return;
        titleClickCount++;
        clearTimeout(titleClickTimer);

        if (titleClickCount >= 5) {
            titleClickCount = 0;
            const analyzer = document.getElementById('hidden-analyzer');
            if (analyzer) {
                if (analyzer.style.display === 'none' || analyzer.style.display === '') {
                    analyzer.style.display = 'block';
                    pickRandomNextSuit();
                    updateCustomHandDisplay();
                    alert('🔓 Hidden Analyzer Activated!');
                } else {
                    analyzer.style.display = 'none';
                }
            }
        } else {
            titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 2000);
        }
    });
}

function pickRandomNextSuit() {
    const available = SUITS.filter(s => s.code !== customSuitCode);
    const chosen = available[Math.floor(Math.random() * available.length)];
    customSuitCode = chosen.code;
}

function renderCustomButtons() {
    const grid = document.getElementById('custom-tile-buttons');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-number';
        btn.innerText = `${i}`;
        btn.onclick = () => addCustomTile(i);
        grid.appendChild(btn);
    }
}

function addCustomTile(num) {
    if (customHand.length >= 13) return;
    const count = customHand.filter(x => x === num).length;
    if (count >= 4) return;
    customHand.push(num);
    customHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

function applyCustomTextInput() {
    const input = document.getElementById('custom-text-input').value.trim();
    if (!/^[1-9]{1,13}$/.test(input)) return;
    let counts = Array(10).fill(0);
    let newHand = [];
    for (let char of input) {
        let n = parseInt(char);
        counts[n]++;
        if (counts[n] > 4) return;
        newHand.push(n);
    }
    pickRandomNextSuit();
    customHand = newHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

async function updateCustomHandDisplay() {
    const container = document.getElementById('custom-hand-container');
    container.innerHTML = '';
    if (customHand.length === 0) {
        container.innerHTML = `<span style="color:#a3b18a; font-size:14px;">Select tiles (1~9)</span>`;
        return;
    }
    for (let i = 0; i < customHand.length; i++) {
        const num = customHand[i];
        const img = document.createElement('img');
        img.src = await getTileImageSrc(customSuitCode, num);
        img.className = 'tile-img';
        img.onclick = () => removeCustomTile(i);
        container.appendChild(img);
    }
}

function removeCustomTile(index) {
    customHand.splice(index, 1);
    updateCustomHandDisplay();
}

function clearCustomHand() {
    customHand = [];
    document.getElementById('custom-text-input').value = '';
    updateCustomHandDisplay();
}

async function analyzeCustomHand() {
    if (customHand.length !== 13) {
        alert('13 tiles required.');
        return;
    }
    const resultData = getWinningTiles(customHand);
    currentSuitObj = SUITS.find(s => s.code === customSuitCode);
    currentHand = [...customHand];
    winningTiles = resultData.waits;
    maxedOutWinningTiles = resultData.maxedOut;
    winningDecompositions = resultData.decomps;
    isChiitoiHand = resultData.isChiitoi;
    isRyanpeikouHand = resultData.isRyanpeikou;
    currentMode = 'hard';

    await renderHandTiles();
    renderSelectionButtons();
    selectedTiles.clear();
    isSubmitted = true;

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message correct';
    resultDiv.innerHTML = `🔍 <b>Analysis Result:</b><br>👉 ${formatAnswerResult()}`;
}

/* -------------------------------------------------------------
   🎮 퀴즈 선택 및 모드 설정
------------------------------------------------------------- */
function selectMode(mode) {
    if (currentMode === 'streak' && mode !== 'streak') clearInterval(timerInterval);
    if (mode === 'streak' && currentMode !== 'streak') {
        document.getElementById('streak-modal').style.display = 'flex';
        return;
    }

    currentMode = mode;
    updateModeUI();
    generateNextQuiz();
}

function startStreakMode() {
    document.getElementById('streak-modal').style.display = 'none';
    currentMode = 'streak';
    streakCount = 0;
    updateModeUI();
    generateNextQuiz();
}

function updateModeUI() {
    document.querySelectorAll('.btn-diff').forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.getElementById(`btn-mode-${currentMode}`);
    if (activeBtn) activeBtn.classList.add('active');

    const modeInfoBox = document.getElementById('mode-info-box');
    const desc = TRANSLATIONS[currentLang]?.descriptions?.[currentMode] || TRANSLATIONS['ko']?.descriptions?.[currentMode];
    if (modeInfoBox && desc) {
        modeInfoBox.innerHTML = desc;
        modeInfoBox.style.display = 'block';
    }

    const streakDisplay = document.getElementById('streak-display');
    const timerDisplay = document.getElementById('timer-display');
    const timerGauge = document.getElementById('timer-gauge-container');

    if (currentMode === 'streak') {
        streakDisplay.innerText = t('streakCount', { count: streakCount });
        streakDisplay.style.display = 'inline-block';
        timerDisplay.style.display = 'inline-block';
        if (timerGauge) timerGauge.style.display = 'block';
    } else {
        streakDisplay.style.display = 'none';
        timerDisplay.style.display = 'none';
        if (timerGauge) timerGauge.style.display = 'none';
    }

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        if (!isSubmitted) {
            submitBtn.innerText = t('btnSubmit');
            submitBtn.style.backgroundColor = '#2980b9';
        } else {
            submitBtn.innerText = currentMode === 'streak' ? t('btnNextStreak') : t('btnNextSame');
            submitBtn.style.backgroundColor = currentMode === 'streak' ? '#8e44ad' : '#27ae60';
        }
    }

    const easyHintDiv = document.getElementById('easy-mode-hint');
    if (easyHintDiv && currentMode === 'easy' && winningTiles.length > 0) {
        easyHintDiv.innerText = t('hintEasy', { count: winningTiles.length });
    }

    // 이미 제출 상태인 경우 번역 업데이트
    if (isSubmitted) {
        const resultDiv = document.getElementById('result');
        if (resultDiv && resultDiv.style.display !== 'none') {
            const answerText = formatAnswerResult();
            const isCorrect = resultDiv.classList.contains('correct');
            const isTimeout = resultDiv.innerText.includes('⏰');
            
            if (isTimeout) {
                resultDiv.innerHTML = `${t('timeout')}<br>👉 ${answerText}`;
            } else if (isCorrect) {
                if (currentMode === 'streak') {
                    resultDiv.innerHTML = `${t('correct')} (${streakCount})<br>👉 ${answerText}`;
                } else {
                    resultDiv.innerHTML = `${t('correct')}<br>👉 ${answerText}`;
                }
            } else {
                resultDiv.innerHTML = `${t('incorrect')}<br>👉 ${answerText}`;
            }
        }
    }
}

async function generateNextQuiz() {
    isSubmitted = false;
    selectedTiles.clear();
    
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'none';
    
    currentSuitObj = SUITS[Math.floor(Math.random() * SUITS.length)];

    let targetDifficulty = currentMode;
    if (currentMode === 'streak') {
        targetDifficulty = Math.random() < 0.2 ? 'normal' : 'hard';
    }

    let hand = [];
    let resultData = { waits: [], maxedOut: [], decomps: {}, isChiitoi: false, isRyanpeikou: false };

    while (true) {
        hand = generateRandom13Tiles();
        resultData = getWinningTiles(hand);
        const count = resultData.waits.length;

        if (targetDifficulty === 'easy') {
            if (count >= 1 && count <= 2) break;
        } else if (targetDifficulty === 'normal') {
            if (count >= 2 && count <= 4) break;
        } else if (targetDifficulty === 'hard') {
            if (count >= 3 && count <= 9) break;
            if (count === 2 && Math.random() < 0.05) break;
        }
    }

    currentHand = hand;
    winningTiles = resultData.waits;
    maxedOutWinningTiles = resultData.maxedOut;
    winningDecompositions = resultData.decomps;
    isChiitoiHand = resultData.isChiitoi;
    isRyanpeikouHand = resultData.isRyanpeikou;

    await renderHandTiles();
    renderSelectionButtons();

    const easyHintDiv = document.getElementById('easy-mode-hint');
    if (currentMode === 'easy') {
        easyHintDiv.innerText = t('hintEasy', { count: winningTiles.length });
        easyHintDiv.style.display = 'block';
    } else {
        easyHintDiv.style.display = 'none';
    }

    if (currentMode === 'streak') startTimer();
    updateModeUI();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerBadge = document.getElementById('timer-display');
    const timerGauge = document.getElementById('timer-gauge-bar');
    if (timerBadge) timerBadge.innerText = t('timerSeconds', { count: timeLeft });
    if (timerGauge) {
        const percentage = (timeLeft / 60) * 100;
        timerGauge.style.width = `${percentage}%`;
    }
}

function handleTimeout() {
    isSubmitted = true;
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message incorrect';
    const answerText = formatAnswerResult();
    resultDiv.innerHTML = `${t('timeout')}<br>👉 ${answerText}`;
    
    if (currentMode === 'streak') checkStreakRecordAndReset();

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = t('btnNextStreak');
    submitBtn.style.backgroundColor = '#8e44ad';
}

function renderSelectionButtons() {
    const grid = document.getElementById('selection-grid');
    grid.innerHTML = '';
    for (let i =
