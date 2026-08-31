/* =============================================================
   📌 (Last Updated: 2026-08-31)
   ============================================================= */
const APP_VERSION = "0.4.2";
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
        
        document.getElementById('status-msg').style.color = '#27ae60';
        document.getElementById('status-msg').innerText = t('loadingSuccess');
        
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);
    } catch (err) {
        document.getElementById('status-msg').style.color = '#e74c3c';
        document.getElementById('status-msg').innerText = t('loadingError');
        console.error(err);
    }
});


// ==========================================
// Google Apps Script API 설정
// ==========================================
const GAS_CONFIG = {
    // 1. 배포된 Google Apps Script Web App URL
    apiUrl: "https://script.google.com/macros/s/AKfycbw7IDyRIqGfps_5Yw7az-9_vPXajFKR-rZaCHpFeBA3sVsnExFFmK70cfxr_Der58RJvA/exec",
    // 2. Apps Script의 SECRET_KEY와 동일하게 유지
    secretKey: "Mahjong_Quiz_Secret_Key_2026",
    // 3. 구글 시트 웹 게시 CSV URL
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

    // HMAC 서명 검증 키 생성: Name_Streak_Timestamp
    const rawMessage = `${playerName}_${streak}_${timestamp}`;
    const signature = CryptoJS.HmacSHA256(rawMessage, GAS_CONFIG.secretKey).toString(CryptoJS.enc.Hex);

    const payload = {
        name: playerName,
        streak: streak,
        timestamp: timestamp,
        signature: signature
    };

    // Google Apps Script Web App으로 JSON 데이터 전송
    fetch(GAS_CONFIG.apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8' // GAS CORS 회피 표준 설정
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.result === 'success') {
            alert(`🎉 ${playerName} (${streak})`);
            document.getElementById('name-input-container').style.display = 'none';
            inputElem.value = '';
            setTimeout(loadLeaderboard, 1500);
        } else {
            alert(`⚠️ ${data.message || 'Error'}`);
        }
    })
    .catch(err => {
        alert('Error');
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

            rows.forEach((row, index) => {
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
               // loadLeaderboard 함수 내부 ul.innerHTML 초기화 교체
               ul.innerHTML = `<li style="text-align:center; padding: 10px; color:#7f8c8d;">${t('hallOfFameLoading')}</li>`;
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
                '<li style="text-align:center; padding: 10px; color:#7f8c8d;">Error</li>';
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
                    alert('🔓 Hidden Analyzer Mode Enabled');
                } else {
                    analyzer.style.display = 'none';
                }
            }
        } else {
            titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 2000);
        }
    });
}

/* -------------------------------------------------------------
   히든 분석기 및 퀴즈 로직
------------------------------------------------------------- */
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
    if (customHand.length >= 13) {
        alert('Max 13 tiles');
        return;
    }
    const count = customHand.filter(x => x === num).length;
    if (count >= 4) {
        alert(`Max 4 tiles for (${num})`);
        return;
    }

    customHand.push(num);
    customHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

function applyCustomTextInput() {
    const input = document.getElementById('custom-text-input').value.trim();
    if (!/^[1-9]{1,13}$/.test(input)) {
        alert('Enter 1-9 digits (max 13)');
        return;
    }

    let counts = Array(10).fill(0);
    let newHand = [];
    for (let char of input) {
        let n = parseInt(char);
        counts[n]++;
        if (counts[n] > 4) {
            alert(`Max 4 tiles for (${n})`);
            return;
        }
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
        container.innerHTML = `<span style="color:#a3b18a; font-size:14px;">${t('analyzerEmptyHint')}</span>`;
        return;
    }

    for (let i = 0; i < customHand.length; i++) {
        const num = customHand[i];
        const img = document.createElement('img');
        img.src = await getTileImageSrc(customSuitCode, num);
        img.className = 'tile-img';
        img.style.cursor = 'pointer';
        img.title = 'Click to remove';
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
    if (customHand.length !== 13) {
        alert(`Hand must contain 13 tiles. (Current: ${customHand.length})`);
        return;
    }

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

    let actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : '-';
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
    infoBox.innerHTML = t(`descriptions.${currentMode}`) || '';
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

function generateQuiz() {
    clearInterval(timerInterval);
    isSubmitted = false;

    updateModeUI();

    let availableSuits = SUITS;
    if (currentSuitObj) {
        availableSuits = SUITS.filter(suit => suit.code !== currentSuitObj.code);
    }
    currentSuitObj = availableSuits[Math.floor(Math.random() * availableSuits.length)];

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

    renderHand();
    renderButtons();
    
    const hintElem = document.getElementById('easy-hint');
    const streakElem = document.getElementById('streak-display');
    const timerElem = document.getElementById('timer-display');
    const timerGaugeContainer = document.getElementById('timer-gauge-container');

    if (currentMode === 'easy') {
        hintElem.innerText = t('hintEasy', { count: winningTiles.length });
        hintElem.style.display = 'inline-block';
    } else {
        hintElem.style.display = 'none';
    }

    if (currentMode === 'streak') {
        streakElem.innerText = t('streakCount', { count: streakCount });
        streakElem.style.display = 'inline-block';
        timerElem.style.display = 'inline-block';
        timerGaugeContainer.style.display = 'block';
        startTimer();
    } else {
        streakElem.style.display = 'none';
        timerElem.style.display = 'none';
        timerGaugeContainer.style.display = 'none';
    }

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = t('btnSubmit');
    submitBtn.style.backgroundColor = '#2980b9';

    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('name-input-container').style.display = 'none';
    selectedTiles.clear();
}

function startTimer() {
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
    document.getElementById('timer-display').innerText = t('timerSeconds', { count: timeLeft });
    const percentage = Math.max(0, (timeLeft / 60) * 100);
    document.getElementById('timer-gauge-bar').style.width = `${percentage}%`;
}

function getWaitTypeBadgeHtml(waitType) {
    switch(waitType) {
        case '양면': return `<span class="wait-type-badge badge-ryanmen">${t('waitRyanmen')}</span>`;
        case '단기': return `<span class="wait-type-badge badge-tanki">${t('waitTanki')}</span>`;
        case '샤보': return `<span class="wait-type-badge badge-shanpon">${t('waitShanpon')}</span>`;
        case '간짱': return `<span class="wait-type-badge badge-kanchan">${t('waitKanchan')}</span>`;
        case '변짱': return `<span class="wait-type-badge badge-penchan">${t('waitPenchan')}</span>`;
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
                    noteStr = ` <span style="color:#e74c3c; font-size:0.9em; font-weight:normal;">${t('maxedNotice', { tiles: overTiles.join(', ') })}</span>`;
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
    html += `<h4>${t('explanationTitle')}</h4>`;

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
                htmlContent: `${getWaitTypeBadgeHtml('단기')} <b>[ ${tile} ]</b> └ <span style="color:#d35400;">[${tile}, <span class="filled-slot">(${tile})</span>]</span>`
            });
        });
    } else {
        const allWaitCandidates = new Set([...validWaits]);
        for (let tNum = 1; tNum <= 9; tNum++) {
            if (origCounts[tNum] === 4) allWaitCandidates.add(tNum);
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
        tagNotice = `<div class="special-tag ryanpeikou-tag">${t('ryanpeikouNotice')}</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">${t('chiitoiNotice')}</div><br>`;
    }

    const actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : '-';
    let baseText = '';

    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        baseText = `${tagNotice}${t('actualWaits')}: [ ${actualStr} ] &nbsp;|&nbsp; ${t('theoreticalWaits')}: [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">${t('maxedNotice', { tiles: maxedOutWinningTiles.join(', ') })}</small>`;
    } else {
        baseText = `${tagNotice}${t('actualWaits')}: [ ${actualStr} ]`;
    }

    if (currentMode !== 'streak') {
        baseText += renderDecompositionExplanation();
    }

    return baseText;
}

function handleTimeout() {
    isSubmitted = true;
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message incorrect';
    resultDiv.innerHTML = `${t('timeout')}<br>👉 ${getAnswerString()}`;

    checkStreakRecordAndReset();

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = t('btnNextSame');
    submitBtn.style.backgroundColor = '#8e44ad';
}

function generateRandom13Tiles() {
    let counts = Array(10).fill(0);
    let hand = [];
    while (hand.length < 13) {
        let num = Math.floor(Math.random() * 9) + 1;
        if (counts[num] < 4) {
            counts[num]++;
            hand.push(num);
        }
    }
    return hand.sort((a, b) => a - b);
}

function getWinningTiles(hand) {
    let waits = [], maxedOut = [], decomps = {};
    let isChiitoi = false, isRyanpeikou = false;
    let counts = Array(10).fill(0);
    hand.forEach(num => counts[num]++);

    for (let tile = 1; tile <= 9; tile++) {
        const checkTile = (isMaxed) => {
            counts[tile]++;
            const checkRes = checkCompleteHand(counts, tile, hand);
            if (checkRes.complete) {
                if (isMaxed) maxedOut.push(tile); else waits.push(tile);
                decomps[tile] = checkRes.decompositions;
                if (checkRes.isRyanpeikou) isRyanpeikou = true;
                else if (checkRes.isChiitoi) isChiitoi = true;
            }
            counts[tile]--;
        };

        if (counts[tile] < 4) checkTile(false);
        else checkTile(true);
    }

    if (isRyanpeikou) isChiitoi = false;
    return { waits, maxedOut, decomps, isChiitoi, isRyanpeikou };
}

function checkCompleteHand(counts, addedTile, originalHand) {
    const decompositions = findAllDecompositions(counts, addedTile, originalHand);
    const isStandard = decompositions.length > 0;

    let pairCount = 0, hasQuad = false;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] === 2) pairCount++;
        if (counts[i] === 4) hasQuad = true;
    }
    const is7Pairs = (pairCount === 7 && !hasQuad);

    if (isStandard && is7Pairs && checkRyanpeikouForm(counts)) {
        return { complete: true, decompositions, isChiitoi: false, isRyanpeikou: true };
    }
    if (isStandard) return { complete: true, decompositions, isChiitoi: false, isRyanpeikou: false };
    if (is7Pairs) return { complete: true, decompositions: [], isChiitoi: true, isRyanpeikou: false };

    return { complete: false, decompositions: [], isChiitoi: false, isRyanpeikou: false };
}

function classifyWaitTypes(decomp, addedTile, originalHand) {
    let results = [];
    let origCounts = Array(10).fill(0);
    originalHand.forEach(n => origCounts[n]++);

    if (decomp.pair === addedTile) results.push({ waitType: '단기', targetMeldStart: null });
    if (decomp.triplets.includes(addedTile) && origCounts[addedTile] === 2) results.push({ waitType: '샤보', targetMeldStart: null });

    for (let s of decomp.sequences) {
        if (addedTile >= s && addedTile <= s + 2) {
            const pos = addedTile - s;
            if (pos === 1) results.push({ waitType: '간짱', targetMeldStart: s });
            else if ((s === 1 && addedTile === 3) || (s === 7 && addedTile === 7)) results.push({ waitType: '변짱', targetMeldStart: s });
            else if (pos === 0 || pos === 2) {
                const oppositeTile = (pos === 0) ? (s + 2) : (s - 1);
                if (oppositeTile >= 1 && oppositeTile <= 9) results.push({ waitType: '양면', targetMeldStart: s });
            }
        }
    }
    return results;
}

function findAllDecompositions(counts, addedTile, originalHand) {
    let results = [];
    let tempCounts = [...counts];

    for (let pairVal = 1; pairVal <= 9; pairVal++) {
        if (tempCounts[pairVal] >= 2) {
            tempCounts[pairVal] -= 2;
            let meldResults = [];
            findMeldsRecursive(tempCounts, [], meldResults);

            meldResults.forEach(m => {
                const trips = [...m.triplets].sort((a,b)=>a-b);
                const seqs = [...m.sequences].sort((a,b)=>a-b);
                const decompCandidate = { pair: pairVal, triplets: trips, sequences: seqs };
                const waitInfos = classifyWaitTypes(decompCandidate, addedTile, originalHand);

                waitInfos.forEach(waitInfo => {
                    results.push({
                        pair: pairVal, triplets: trips, sequences: seqs,
                        waitType: waitInfo.waitType, targetMeldStart: waitInfo.targetMeldStart,
                        key: `${pairVal}|T:${trips.join(',')}|S:${seqs.join(',')}|W:${waitInfo.waitType}|M:${waitInfo.targetMeldStart}`
                    });
                });
            });
            tempCounts[pairVal] += 2;
        }
    }

    let uniqueResults = [];
    let seenKeys = new Set();
    results.forEach(r => {
        if (!seenKeys.has(r.key)) {
            seenKeys.add(r.key);
            uniqueResults.push(r);
        }
    });

    return uniqueResults;
}

function findMeldsRecursive(counts, currentMelds, results) {
    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] > 0) { first = i; break; }
    }

    if (first === 0) {
        let triplets = [], sequences = [];
        currentMelds.forEach(m => {
            if (m.type === 'triplet') triplets.push(m.val);
            else if (m.type === 'sequence') sequences.push(m.val);
        });
        results.push({ triplets, sequences });
        return;
    }

    if (counts[first] >= 3) {
        counts[first] -= 3;
        currentMelds.push({ type: 'triplet', val: first });
        findMeldsRecursive(counts, currentMelds, results);
        currentMelds.pop();
        counts[first] += 3;
    }

    if (first <= 7 && counts[first + 1] > 0 && counts[first + 2] > 0) {
        counts[first]--; counts[first + 1]--; counts[first + 2]--;
        currentMelds.push({ type: 'sequence', val: first });
        findMeldsRecursive(counts, currentMelds, results);
        currentMelds.pop();
        counts[first]++; counts[first + 1]++; counts[first + 2]++;
    }
}

function checkRyanpeikouForm(counts) {
    let tempCounts = [...counts];
    for (let i = 1; i <= 9; i++) {
        if (tempCounts[i] >= 2) {
            tempCounts[i] -= 2;
            if (canFormTwoIdenticalChowPairs(tempCounts)) return true;
            tempCounts[i] += 2;
        }
    }
    return false;
}

function canFormTwoIdenticalChowPairs(counts) {
    let tempCounts = [...counts];
    let doubleChowCount = 0;
    for (let i = 1; i <= 7; i++) {
        while (tempCounts[i] >= 2 && tempCounts[i+1] >= 2 && tempCounts[i+2] >= 2) {
            tempCounts[i] -= 2; tempCounts[i+1] -= 2; tempCounts[i+2] -= 2;
            doubleChowCount++;
        }
    }
    return doubleChowCount === 2;
}

async function renderHand() {
    const container = document.getElementById('hand-container');
    container.innerHTML = '';
    for (const num of currentHand) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(currentSuitObj.code, num);
        img.className = 'tile-img';
        img.alt = `${currentSuitObj.code}${num}`;
        container.appendChild(img);
    }
}

function renderButtons() {
    const grid = document.getElementById('selection-buttons');
    grid.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-number';
        btn.id = `btn-num-${i}`;
        btn.innerText = `${i}`;
        btn.onclick = () => toggleSelect(i, btn);
        grid.appendChild(btn);
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

function handleSubmitOrNext() {
    if (isSubmitted) { generateQuiz(); return; }
    if (selectedTiles.size === 0) return;

    clearInterval(timerInterval);
    const userAnswers = Array.from(selectedTiles).sort((a, b) => a - b);
    
    const isCorrectActual = userAnswers.length === winningTiles.length && 
                            userAnswers.every((val, idx) => val === winningTiles[idx]);

    const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
    const isCorrectTheoretical = userAnswers.length === theoreticalList.length && 
                                userAnswers.every((val, idx) => val === theoreticalList[idx]);

    const isCorrect = isCorrectActual || isCorrectTheoretical;
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';

    const answerText = getAnswerString();

    if (isCorrect) {
        resultDiv.className = 'result-message correct';
        if (currentMode === 'streak') {
            streakCount++;
            document.getElementById('streak-display').innerText = t('streakCount', { count: streakCount });
            resultDiv.innerHTML = `${t('correct')}<br>👉 ${answerText}`;
        } else {
            resultDiv.innerHTML = `${t('correct')}<br>👉 ${answerText}`;
        }
    } else {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `${t('incorrect')}<br>👉 ${answerText}`;
        if (currentMode === 'streak') checkStreakRecordAndReset();
    }

    isSubmitted = true;
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = currentMode === 'streak' ? t('btnNextStreak') : t('btnNextSame');
    submitBtn.style.backgroundColor = currentMode === 'streak' ? '#8e44ad' : '#27ae60';
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

function copyCurrentQuizToCustom() {
    if (!currentHand || currentHand.length !== 13) {
        alert('No quiz data');
        return;
    }
    customHand = [...currentHand];
    if (typeof currentSuitObj !== 'undefined' && currentSuitObj && currentSuitObj.code) {
        customSuitCode = currentSuitObj.code;
    }
    const textInput = document.getElementById('custom-text-input');
    if (textInput) textInput.value = customHand.join('');

    updateCustomHandDisplay();
}
