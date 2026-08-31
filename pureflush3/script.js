/* =============================================================
   📌 (Last Updated: 2026-08-31) - v0.4.0 Multilingual Support
   ============================================================= */
const APP_VERSION = "0.4.1";
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
let lastCheckResult = null; // 결과 저장용 ({ isCorrect, isTimeout })

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
    // 저장된 언어로 드롭다운 초기화
    const langSelect = document.getElementById('lang-select');
    if (langSelect && typeof currentLang !== 'undefined') {
        langSelect.value = currentLang;
    }
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
        statusMsg.setAttribute('data-i18n', 'loadingSuccess');
        statusMsg.innerText = t('loadingSuccess');
        
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);
    } catch (err) {
        const statusMsg = document.getElementById('status-msg');
        statusMsg.style.color = '#e74c3c';
        statusMsg.setAttribute('data-i18n', 'loadingError');
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
   📊 HMAC 서명 생성 및 Apps Script 기록 저장 (Write)
------------------------------------------------------------- */
function saveRecord() {
    const inputElem = document.getElementById('player-name-input');
    const saveBtn = document.getElementById('btn-save-record');
    let playerName = inputElem.value.trim();
    
    if (!playerName) {
        playerName = 'Anonymous';
    }

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
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.result === 'success') {
            alert(`🎉 ${playerName} (${streak}連勝)`);
            document.getElementById('name-input-container').style.display = 'none';
            inputElem.value = '';
            setTimeout(loadLeaderboard, 1500);
        } else {
            alert(`⚠️ ${data.message || 'Error'}`);
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
   📊 구글 시트 실시간 리더보드 조회 (Read)
------------------------------------------------------------- */
function loadLeaderboard() {
    if (!GAS_CONFIG.csvUrl || GAS_CONFIG.csvUrl.includes('YOUR_SHEET_ID')) {
        document.getElementById('record-list-ul').innerHTML = 
            '<li style="text-align:center; padding:10px; color:#e74c3c;">CSV URL Error</li>';
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

                if (
                    rawTimestamp.includes('타임스탬프') || 
                    rawTimestamp.includes('Timestamp') || 
                    name.includes('Name') || 
                    isNaN(streak)
                ) {
                    return;
                }

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
                ul.innerHTML = '<li style="text-align:center; padding: 10px; color:#7f8c8d;">No Records</li>';
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
            document.getElementById('record-list-ul').innerHTML = 
                '<li style="text-align:center; padding: 10px; color:#7f8c8d;">Failed to load leaderboard.</li>';
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
        console.warn("Timestamp parsing error:", e);
    }
    return str;
}

/* -------------------------------------------------------------
   🔒 히든 패 분석기 트리거
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
        container.innerHTML = `<span style="color:#a3b18a; font-size:14px;">1~9 선택</span>`;
        return;
    }

    for (let i = 0; i < customHand.length; i++) {
        const num = customHand[i];
        const img = document.createElement('img');
        img.src = await getTileImageSrc(customSuitCode, num);
        img.className = 'tile-img';
        img.style.cursor = 'pointer';
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
    document.getElementById('custom-result').style.display = 'none';
    pickRandomNextSuit();
    updateCustomHandDisplay();
}

function analyzeCustomHand() {
    if (customHand.length !== 13) return;

    const resultData = getWinningTiles(customHand);
    const resultDiv = document.getElementById('custom-result');
    resultDiv.style.display = 'block';

    const savedHand = [...currentHand];
    const savedWaits = [...winningTiles];
    const savedMaxed = [...maxedOutWinningTiles];
    const savedDecomps = { ...winningDecompositions };
    const savedChiitoi = isChiitoiHand;
    const savedRyan = isRyanpeikouHand;
    const savedMode = currentMode;

    currentHand = [...customHand];
    winningTiles = resultData.waits;
    maxedOutWinningTiles = resultData.maxedOut;
    winningDecompositions = resultData.decomps;
    isChiitoiHand = resultData.isChiitoi;
    isRyanpeikouHand = resultData.isRyanpeikou;
    currentMode = 'hard'; 

    let actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : 'No-ten';
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">${t('ryanpeikouNotice')}</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">${t('chiitoiNotice')}</div><br>`;
    }

    let htmlStr = '';
    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        htmlStr = `${tagNotice}<b>${t('actualWaits')}:</b> [ ${actualStr} ] &nbsp;|&nbsp; <b>${t('theoreticalWaits')}:</b> [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">${t('maxedNotice', { tiles: maxedOutWinningTiles.join(', ') })}</small>`;
    } else {
        htmlStr = `${tagNotice}<b>${t('actualWaits')}:</b> [ ${actualStr} ]`;
    }

    if (winningTiles.length > 0 || maxedOutWinningTiles.length > 0) {
        htmlStr += renderDecompositionExplanation();
        resultDiv.className = 'result-message correct';
    } else {
        resultDiv.className = 'result-message incorrect';
    }
    resultDiv.innerHTML = htmlStr;

    currentHand = savedHand;
    winningTiles = savedWaits;
    maxedOutWinningTiles = savedMaxed;
    winningDecompositions = savedDecomps;
    isChiitoiHand = savedChiitoi;
    isRyanpeikouHand = savedRyan;
    currentMode = savedMode;
}

async function getTileImageSrc(suitCode, num) {
    const targetName = `${suitCode}${num}.svg`;
    const cacheKey = `${suitCode}${num}`;
    if (tileSvgCache[cacheKey]) return tileSvgCache[cacheKey];
    let targetFile = null;
    zipInstance.forEach((relativePath, file) => {
        if (relativePath.endsWith(targetName)) targetFile = file;
    });
    if (targetFile) {
        const text = await targetFile.async('string');
        const blob = new Blob([text], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        tileSvgCache[cacheKey] = url;
        return url;
    }
    return '';
}

function selectMode(mode) {
    if (currentMode !== mode) streakCount = 0;
    currentMode = mode;
    if (mode === 'streak' && !sessionStorage.getItem('streak_notice_shown')) {
        document.getElementById('streak-modal').style.display = 'flex';
    } else {
        generateQuiz();
    }
}

function startStreakModeAfterNotice() {
    sessionStorage.setItem('streak_notice_shown', 'true');
    document.getElementById('streak-modal').style.display = 'none';
    generateQuiz();
}

function updateModeUI() {
    document.querySelectorAll('.btn-diff').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-mode-${currentMode}`);
    if (activeBtn) activeBtn.classList.add('active');

    const infoBox = document.getElementById('mode-info-box');
    if (infoBox) {
        const desc = TRANSLATIONS[currentLang]?.descriptions?.[currentMode] 
                  || TRANSLATIONS['ko']?.descriptions?.[currentMode] 
                  || '';
        infoBox.innerHTML = desc;
        infoBox.style.display = 'block';

        if (currentMode === 'streak') {
            infoBox.style.backgroundColor = '#f5ee2e15';
            infoBox.style.borderColor = '#8e44ad';
            infoBox.style.color = '#4a235a';
        } else {
            infoBox.style.backgroundColor = '#f8f9fa';
            infoBox.style.borderColor = '#ced4da';
            infoBox.style.color = '#2c3e50';
        }
    }

    const streakBadge = document.getElementById('streak-display');
    if (streakBadge && streakBadge.style.display !== 'none') {
        streakBadge.innerText = t('streakCount', { count: streakCount });
    }

    const timerBadge = document.getElementById('timer-display');
    if (timerBadge && timerBadge.style.display !== 'none') {
        timerBadge.innerText = t('timerSeconds', { count: timeLeft });
    }

    const easyHint = document.getElementById('easy-hint');
    if (easyHint && easyHint.style.display !== 'none') {
        easyHint.innerText = t('hintEasy', { count: winningTiles.length });
    }

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        if (isSubmitted) {
            submitBtn.innerText = t(currentMode === 'streak' ? 'btnNextStreak' : 'btnNextSame');
        } else {
            submitBtn.innerText = t('btnSubmit');
        }
    }

    if (isSubmitted && lastCheckResult) {
        renderQuizResult();
    }
}

function generateQuiz() {
    clearInterval(timerInterval);
    isSubmitted = false;
    lastCheckResult = null;
    selectedTiles.clear();
    updateSelectionButtonsUI();

    const streakBadge = document.getElementById('streak-display');
    const timerBadge = document.getElementById('timer-display');
    const timerGaugeContainer = document.getElementById('timer-gauge-container');
    const timerGaugeBar = document.getElementById('timer-gauge-bar');
    const easyHint = document.getElementById('easy-hint');
    const resultDiv = document.getElementById('quiz-result');

    resultDiv.style.display = 'none';

    if (currentMode === 'streak') {
        streakBadge.style.display = 'inline-block';
        streakBadge.innerText = t('streakCount', { count: streakCount });
        timerBadge.style.display = 'inline-block';
        timerGaugeContainer.style.display = 'block';
        timerGaugeBar.style.width = '100%';
        easyHint.style.display = 'none';
        startTimer();
    } else {
        streakBadge.style.display = 'none';
        timerBadge.style.display = 'none';
        timerGaugeContainer.style.display = 'none';
    }

    currentSuitObj = SUITS[Math.floor(Math.random() * SUITS.length)];
    const numWaitsNeeded = currentMode === 'easy' ? Math.floor(Math.random() * 2) + 1 : null;

    let valid = false;
    while (!valid) {
        currentHand = generateRandomPureFlushHand();
        const resultData = getWinningTiles(currentHand);
        winningTiles = resultData.waits;
        maxedOutWinningTiles = resultData.maxedOut;
        winningDecompositions = resultData.decomps;
        isChiitoiHand = resultData.isChiitoi;
        isRyanpeikouHand = resultData.isRyanpeikou;

        if (winningTiles.length === 0) continue;

        if (currentMode === 'easy') {
            if (winningTiles.length === numWaitsNeeded) valid = true;
        } else if (currentMode === 'normal') {
            if (winningTiles.length >= 2 && winningTiles.length <= 4) valid = true;
        } else if (currentMode === 'hard' || currentMode === 'streak') {
            if (winningTiles.length >= 3) valid = true;
        }
    }

    if (currentMode === 'easy') {
        easyHint.style.display = 'inline-block';
        easyHint.innerText = t('hintEasy', { count: winningTiles.length });
    } else if (currentMode !== 'streak') {
        easyHint.style.display = 'none';
    }

    displayHandTiles(currentHand);
    updateModeUI();
}

function startTimer() {
    timeLeft = 60;
    updateTimerUI();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (currentMode === 'streak') checkStreakRecordAndReset();
            lastCheckResult = { isCorrect: false, isTimeout: true };
            isSubmitted = true;
            renderQuizResult();
        }
    }, 1000);
}

function updateTimerUI() {
    const timerBadge = document.getElementById('timer-display');
    const timerGaugeBar = document.getElementById('timer-gauge-bar');
    if (timerBadge) timerBadge.innerText = t('timerSeconds', { count: timeLeft });
    if (timerGaugeBar) {
        const pct = (timeLeft / 60) * 100;
        timerGaugeBar.style.width = `${pct}%`;
    }
}

async function displayHandTiles(hand) {
    const container = document.getElementById('hand-container');
    container.innerHTML = '';
    for (let num of hand) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(currentSuitObj.code, num);
        img.className = 'tile-img';
        container.appendChild(img);
    }
}

function toggleSelect(num, btn) {
    if (isSubmitted) return;
    if (selectedTiles.has(num)) {
        selectedTiles.delete(num);
        btn.classList.remove('selected');
    } else {
        selectedTiles.add(num);
        btn.classList.add('selected');
    }
}

function updateSelectionButtonsUI() {
    for (let i = 1; i <= 9; i++) {
        const btn = document.getElementById(`btn-num-${i}`);
        if (btn) btn.classList.remove('selected');
    }
}

function handleSubmitOrNext() {
    if (isSubmitted) {
        generateQuiz();
    } 
   else if (selectedTiles.size === 0) {
      return;
    }
    else {
        checkAnswer();
    }
}

function checkAnswer() {
    if (isSubmitted) {
        generateQuiz();
        return;
    }

    if (timerInterval) clearInterval(timerInterval);

    const userSelection = Array.from(selectedTiles).sort((a, b) => a - b);
    const correctSelection = [...winningTiles].sort((a, b) => a - b);

    const isCorrect = userSelection.length === correctSelection.length &&
                      userSelection.every((val, idx) => val === correctSelection[idx]);

    if (isCorrect) {
        if (currentMode === 'streak') streakCount++;
    } else {
        if (currentMode === 'streak') checkStreakRecordAndReset();
    }

    lastCheckResult = { isCorrect, isTimeout: false };
    isSubmitted = true;

    renderQuizResult();
}

function renderQuizResult() {
    if (!isSubmitted || !lastCheckResult) return;

    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'block';

    let actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : 'No-ten';
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">${t('ryanpeikouNotice')}</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">${t('chiitoiNotice')}</div><br>`;
    }

    let answerText = '';
    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        const maxedTilesFormatted = maxedOutWinningTiles.join(', ');
        const maxedMsg = t('maxedNotice', { tiles: maxedTilesFormatted });
        answerText = `${tagNotice}<b>${t('actualWaits')}:</b> [ ${actualStr} ] &nbsp;|&nbsp; <b>${t('theoreticalWaits')}:</b> [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">${maxedMsg}</small>`;
    } else {
        answerText = `${tagNotice}<b>${t('actualWaits')}:</b> [ ${actualStr} ]`;
    }

    if (currentMode !== 'streak' && (winningTiles.length > 0 || maxedOutWinningTiles.length > 0)) {
        answerText += renderDecompositionExplanation();
    }

    if (lastCheckResult.isTimeout) {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `${t('timeout')}<br>👉 ${answerText}`;
    } else if (lastCheckResult.isCorrect) {
        resultDiv.className = 'result-message correct';
        if (currentMode === 'streak') {
            resultDiv.innerHTML = `${t('correct')} (${t('streakCount', { count: streakCount })})<br>👉 ${answerText}`;
        } else {
            resultDiv.innerHTML = `${t('correct')}<br>👉 ${answerText}`;
        }
    } else {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `${t('incorrect')}<br>👉 ${answerText}`;
    }

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        submitBtn.innerText = t(currentMode === 'streak' ? 'btnNextStreak' : 'btnNextSame');
        submitBtn.style.backgroundColor = currentMode === 'streak' ? '#8e44ad' : '#27ae60';
    }
}

function getWaitTypeName(type) {
    switch (type) {
        case '양면': return t('waitRyanmen');
        case '단기': return t('waitTanki');
        case '샤보': return t('waitShanpon');
        case '간짱': return t('waitKanchan');
        case '변짱': return t('waitPenchan');
        default: return type;
    }
}


function getWaitTypeBadgeHtml(waitType) {
    switch(waitType) {
        case '양면': return `<span class="wait-type-badge badge-ryanmen">양면 대기</span>`;
        case '단기': return `<span class="wait-type-badge badge-tanki">단기 대기</span>`;
        case '샤보': return `<span class="wait-type-badge badge-shanpon">샤보 대기</span>`;
        case '간짱': return `<span class="wait-type-badge badge-kanchan">간짱 대기</span>`;
        case '변짱': return `<span class="wait-type-badge badge-penchan">변짱 대기</span>`;
        default: return `<span class="wait-type-badge badge-tanki">${waitType}</span>`;
    }
}

function getRyanmenExplanationItems(d, validWaitsSet) {
    const w1 = d.targetMeldStart - 1;
    const w2 = d.targetMeldStart + 2;
    const w1Valid = validWaitsSet.has(w1);
    const w2Valid = validWaitsSet.has(w2);

    const waitTiles = [w1, w2].filter(x => validWaitsSet.has(x)).sort((a, b) => a - b);
    if (waitTiles.length < 2) return null;

    const w1Str = w1Valid ? `<span class="filled-slot">(${w1})</span>` : '';
    const w2Str = w2Valid ? `<span class="filled-slot">(${w2})</span>` : '';

    let parts = [];
    parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));

    let targetMeldHandled = false;
    d.sequences.forEach(s => {
        if (!targetMeldHandled && s === d.targetMeldStart) {
            let meldParts = [];
            if (w1Str) meldParts.push(w1Str);
            meldParts.push(s);
            meldParts.push(s + 1);
            if (w2Str) meldParts.push(w2Str);

            parts.push(`<span style="color:#2980b9; font-weight:bold;">[${meldParts.join(', ')}]</span>`);
            targetMeldHandled = true;
        } else {
            parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`);
        }
    });

    const groupKey = `ryanmen_p${d.pair}_t${d.triplets.slice().sort().join(',')}_s${d.sequences.slice().sort().join(',')}_m${d.targetMeldStart}`;
    return {
        waitType: '양면',
        sortOrder: 1,
        groupKey: groupKey,
        tiles: waitTiles,
        partsStr: parts.join(' ')
    };
}

function getShanponExplanationItems(d, tile, validWaitsSet, origCounts) {
    let items = [];
    const p = d.pair;

    d.triplets.forEach(t => {
        if (t === tile || p === tile) {
            const shanponPair = [p, t].sort((a, b) => a - b);
            const st1 = shanponPair[0];
            const st2 = shanponPair[1];

            const st1Is4Count = origCounts[st1] === 4;
            const st2Is4Count = origCounts[st2] === 4;

            if (origCounts[st1] >= 2 && origCounts[st2] >= 2) {
                let parts = [];
                parts.push(`<span style="color:#27ae60; font-weight:bold;">[${st1}, ${st1}, <span class="filled-slot">(${st1})</span>]</span>`);
                parts.push(`<span style="color:#27ae60; font-weight:bold;">[${st2}, ${st2}, <span class="filled-slot">(${st2})</span>]</span>`);

                d.triplets.forEach(tr => {
                    if (tr !== p && tr !== t) {
                        parts.push(`<span style="color:#27ae60;">[${tr},${tr},${tr}]</span>`);
                    }
                });
                d.sequences.forEach(s => parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`));

                let noteStr = '';
                if (st1Is4Count || st2Is4Count) {
                    const overTiles = [st1Is4Count ? st1 : null, st2Is4Count ? st2 : null].filter(Boolean);
                    noteStr = ` <span style="color:#e74c3c; font-size:0.9em; font-weight:normal;">(※ ${overTiles.join(', ')}번 패는 4장 이미 소지하여 화료 불가)</span>`;
                }

                const remainingTriplets = d.triplets.filter(tr => tr !== p && tr !== t).sort().join('_');
                const sortedSeqs = d.sequences.slice().sort().join('_');
                const groupKey = `shanpon_pair_${st1}_${st2}_remT_${remainingTriplets}_seqs_${sortedSeqs}`;

                items.push({
                    waitType: '샤보',
                    sortOrder: 2,
                    groupKey: groupKey,
                    tiles: [st1, st2],
                    partsStr: parts.join(' ') + noteStr
                });
            }
        }
    });

    return items;
}

function getSingleWaitExplanationItems(d, tile, waitType, validWaitsSet) {
    if (!validWaitsSet.has(tile)) return null;

    let parts = [];
    if (waitType === '단기') {
        parts.push(`<span style="color:#d35400; font-weight:bold;">[${tile}, <span class="filled-slot">(${tile})</span>]</span>`);
    } else {
        parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
    }

    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));

    let targetMeldHandled = false;
    d.sequences.forEach(s => {
        if (!targetMeldHandled && d.targetMeldStart === s && (waitType === '간짱' || waitType === '변짱')) {
            let meldStr = [];
            for (let i = 0; i < 3; i++) {
                let curr = s + i;
                if (curr === tile) {
                    meldStr.push(`<span class="filled-slot">(${curr})</span>`);
                } else {
                    meldStr.push(curr);
                }
            }
            parts.push(`<span style="color:#2980b9; font-weight:bold;">[${meldStr.join(',')}]</span>`);
            targetMeldHandled = true;
        } else {
            parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`);
        }
    });

    let sortOrder = 3; 
    if (waitType === '간짱') sortOrder = 4;
    if (waitType === '변짱') sortOrder = 5;

    const groupKey = `${waitType}_tile${tile}_p${d.pair}_t${d.triplets.slice().sort().join(',')}_s${d.sequences.slice().sort().join(',')}_m${d.targetMeldStart}`;

    return {
        waitType: waitType,
        sortOrder: sortOrder,
        groupKey: groupKey,
        tiles: [tile],
        partsStr: parts.join(' ')
    };
}

function renderDecompositionExplanation() {
    if (currentMode === 'streak') return ''; 

    let html = `<div class="explanation-box">`;
    html += `<h4>🔍 대기패별 대기 유형 및 손패 구조 해설</h4>`;

    let origCounts = Array(10).fill(0);
    currentHand.forEach(n => origCounts[n]++);

    const validWaits = [...winningTiles].sort((a, b) => a - b);
    const validWaitsSet = new Set(validWaits);
    let itemsList = [];

    if (isChiitoiHand) {
        validWaits.forEach(tile => {
            itemsList.push({
                waitType: '단기',
                sortOrder: 3,
                groupKey: `chiitoi_${tile}`,
                tiles: [tile],
                htmlContent: `${getWaitTypeBadgeHtml('단기')} <b>[ ${tile} ]</b> └ 치이토이츠(7쌍) 완성 형태 → <span style="color:#d35400;">[${tile}, <span class="filled-slot">(${tile})</span>]</span>`
            });
        });
    } else {
        const allWaitCandidates = new Set([...validWaits]);
        for (let t = 1; t <= 9; t++) {
            if (origCounts[t] === 4) allWaitCandidates.add(t);
        }
        const candidateWaits = [...allWaitCandidates].sort((a, b) => a - b);

        candidateWaits.forEach(tile => {
            const decomps = winningDecompositions[tile] || [];
            decomps.forEach(d => {
                let waitType = d.waitType;
                if (waitType === '양면') {
                    const item = getRyanmenExplanationItems(d, validWaitsSet);
                    if (item) itemsList.push(item);
                } else if (waitType === '샤보') {
                    const items = getShanponExplanationItems(d, tile, validWaitsSet, origCounts);
                    itemsList.push(...items);
                } else {
                    const item = getSingleWaitExplanationItems(d, tile, waitType, validWaitsSet);
                    if (item) itemsList.push(item);
                }
            });
        });
    }

    let uniqueMap = new Map();
    itemsList.forEach(item => {
        if (!uniqueMap.has(item.groupKey)) uniqueMap.set(item.groupKey, item);
    });

    let renderItems = Array.from(uniqueMap.values());
    renderItems.sort((a, b) => (a.sortOrder !== b.sortOrder) ? a.sortOrder - b.sortOrder : (a.tiles[0] || 0) - (b.tiles[0] || 0));

    renderItems.forEach(group => {
        const tileHeader = group.tiles.length > 1 ? `[ ${group.tiles.join(', ')} ]` : `[ ${group.tiles[0]} ]`;
        const badge = getWaitTypeBadgeHtml(group.waitType);

        if (group.htmlContent) {
            html += `<div class="explanation-item">${group.htmlContent}</div>`;
        } else {
            html += `<div class="explanation-item">${badge} <b>${tileHeader}</b> --- ${group.partsStr}</div>`;
        }
    });

    html += `</div>`;
    return html;
}

function getAnswerString() {
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">💡 이 문제는 량페코(兩盃口) 형태가 포함된 문제입니다.</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">💡 이 문제는 청일색과 치또이즈(七対子)가 조합된 단기대기 문제입니다.</div><br>`;
    }

    const actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : '없음';
    let baseText = '';

    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        baseText = `${tagNotice}실제 오름패: [ ${actualStr} ] &nbsp;|&nbsp; 이론상 대기패: [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">(※ ${maxedOutWinningTiles.join(', ')}번 패는 오름패 형태이지만 4장을 모두 가지고 있어 오를 수 없음)</small>`;
    } else {
        baseText = `${tagNotice}오름패: [ ${actualStr} ]`;
    }

    if (currentMode !== 'streak') {
        baseText += renderDecompositionExplanation();
    }

    return baseText;
}



function checkStreakRecordAndReset() {
    if (streakCount >= 10) {
        pendingRecordStreak = streakCount;
        document.getElementById('name-input-container').style.display = 'block';
    }
    streakCount = 0;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateRandomPureFlushHand() {
    let hand = [];
    let counts = Array(10).fill(0);

    while (hand.length < 13) {
        let tile = Math.floor(Math.random() * 9) + 1;
        if (counts[tile] < 4) {
            counts[tile]++;
            hand.push(tile);
        }
    }
    return hand.sort((a, b) => a - b);
}

function getWinningTiles(hand) {
    const counts = Array(10).fill(0);
    hand.forEach(x => counts[x]++);

    const validWaits = [];
    const maxedOutWaits = [];
    const decomps = {};

    let isChiitoi = false;
    let isRyanpeikou = false;

    for (let tile = 1; tile <= 9; tile++) {
        if (counts[tile] === 4) {
            counts[tile]++;
            const decs = analyzeHandDecomposition(counts);
            if (decs.length > 0) {
                maxedOutWaits.push(tile);
                decomps[tile] = decs;
            }
            counts[tile]--;
            continue;
        }

        counts[tile]++;
        const decs = analyzeHandDecomposition(counts);
        if (decs.length > 0) {
            validWaits.push(tile);
            decomps[tile] = decs;

            decs.forEach(d => {
                if (d.isChiitoi) isChiitoi = true;
                if (d.isRyanpeikou) isRyanpeikou = true;
            });
        }
        counts[tile]--;
    }

    return {
        waits: validWaits,
        maxedOut: maxedOutWaits,
        decomps: decomps,
        isChiitoi: isChiitoi,
        isRyanpeikou: isRyanpeikou
    };
}

function analyzeHandDecomposition(counts) {
    const results = [];

    // 七対子 (칠대쌍) 검사
    let pairCount = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] === 2) pairCount++;
    }
    if (pairCount === 7) {
        results.push({ type: '단기', head: '7쌍', body: [], isChiitoi: true });
    }

    // 일반 멘츠 분해
    for (let i = 1; i <= 9; i++) {
        if (counts[i] >= 2) {
            counts[i] -= 2;
            const bodies = [];
            searchMentsu(counts, 1, bodies, i, results);
            counts[i] += 2;
        }
    }

    return results;
}

function searchMentsu(counts, startIndex, currentBodies, headNum, results) {
    let idx = startIndex;
    while (idx <= 9 && counts[idx] === 0) idx++;

    if (idx > 9) {
        let isRyanpeikou = false;
        if (currentBodies.length === 4) {
            const shuntsuList = currentBodies.filter(b => b.includes('-')).sort();
            if (shuntsuList.length === 4 && shuntsuList[0] === shuntsuList[1] && shuntsuList[2] === shuntsuList[3]) {
                isRyanpeikou = true;
            }
        }

        const waitType = determineWaitType(headNum, currentBodies);
        results.push({
            type: waitType,
            head: `${headNum}${headNum}`,
            body: [...currentBodies],
            isRyanpeikou: isRyanpeikou
        });
        return;
    }

    if (counts[idx] >= 3) {
        counts[idx] -= 3;
        currentBodies.push(`${idx}${idx}${idx}`);
        searchMentsu(counts, idx, currentBodies, headNum, results);
        currentBodies.pop();
        counts[idx] += 3;
    }

    if (idx <= 7 && counts[idx] > 0 && counts[idx+1] > 0 && counts[idx+2] > 0) {
        counts[idx]--; counts[idx+1]--; counts[idx+2]--;
        currentBodies.push(`${idx}-${idx+1}-${idx+2}`);
        searchMentsu(counts, idx, currentBodies, headNum, results);
        currentBodies.pop();
        counts[idx]++; counts[idx+1]++; counts[idx+2]++;
    }
}

function determineWaitType(headNum, bodies) {
    if (bodies.length < 4) return '단기';
    const hasHeadInBodies = bodies.some(b => b.includes(String(headNum)));
    if (!hasHeadInBodies) return '단기';
    if (bodies.some(b => b === `${headNum}${headNum}${headNum}`)) return '샤보';
    return '양면';
}
