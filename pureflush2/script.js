/* =============================================================
   📌 (Last Updated: 2026-08-31) - v0.4c 다국어 연동 최소 수정
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

const MODE_DESCRIPTIONS = {
    easy: `📌 <b>🌱 쉬움 모드:</b><br>• 1~2개의 오름패만 존재하는 쉬운 문제이며, 오름패가 몇개인지도 알려 줍니다.<br>• 제출 후 대기 유형(양면, 단기, 샤보, 간짱, 변짱) 및 세부 분해 해설을 제공합니다.`,
    normal: `📌 <b>🌿 보통 모드:</b><br>• 일반적으로 2개의 오름패인 문제 위주로 출제됩니다만, 3개 이상의 오름패인 경우도 있습니다.<br>• 제출 후 대기 유형(양면, 단기, 샤보, 간짱, 변짱)과 세부 분해 해설을 제공줍니다.`,
    hard: `📌 <b>🔥 어려움 모드:</b><br>• 기본적으로 여러 형태의 다면대기 문제입니다.<br>• 제출 후 다면대기가 만드는 다양한 대기 유형과 분해 형태를 모두 분석해 드립니다.`,
    streak: `📌 <b>⚡ 어려움 연승 모드 규칙:</b><br>• ⏱️ <b>60초 제한시간:</b> 문제당 60초 안에 정답을 맞혀야 합니다.<br>• ⚡ 숙련자를 위한 모드로 <b>별도의 패 분해 해설이 제공되지 않고</b> 빠른 진행을 지원합니다.`
};

/**
 * 🌐 index.html 및 i18n.js 연동용 모드 설명 동기화 함수 (v0.4 추가)
 */
function syncModeDescriptions(lang) {
    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].descriptions) {
        Object.assign(MODE_DESCRIPTIONS, TRANSLATIONS[lang].descriptions);
    }
    updateModeUI();
}

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
        document.getElementById('status-msg').innerText = '✅ 마작패 로딩 완료! 원하시는 모드를 선택하세요.';
        
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);
    } catch (err) {
        document.getElementById('status-msg').style.color = '#e74c3c';
        document.getElementById('status-msg').innerText = '❌ Regular.zip 로딩 실패! index.html과 같은 폴더에 Regular.zip이 있는지 확인해주세요.';
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
    saveBtn.innerText = '검증 및 등록 중...';

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
            alert(`🎉 ${playerName} 님의 ${streak}연승 기록이 검증을 통과하여 명예의 전당에 등록되었습니다!`);
            document.getElementById('name-input-container').style.display = 'none';
            inputElem.value = '';
            setTimeout(loadLeaderboard, 1500);
        } else {
            alert(`⚠️ 등록 실패: ${data.message || '인증 오류가 발생했습니다.'}`);
        }
    })
    .catch(err => {
        alert('기록 저장 도중 네트워크 오류가 발생했습니다.');
        console.error(err);
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerText = '기록 등록';
    });
}

/* -------------------------------------------------------------
   📊 구글 시트 실시간 리더보드 조회 (Read)
------------------------------------------------------------- */
function loadLeaderboard() {
    if (!GAS_CONFIG.csvUrl || GAS_CONFIG.csvUrl.includes('YOUR_SHEET_ID')) {
        document.getElementById('record-list-ul').innerHTML = 
            '<li style="text-align:center; padding:10px; color:#e74c3c;">구글 시트 CSV URL 설정이 필요합니다.</li>';
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
                ul.innerHTML = '<li style="text-align:center; padding: 10px; color:#7f8c8d;">등록된 기록이 없습니다. 10연승에 도전해보세요!</li>';
                return;
            }

            top10.forEach((rec, idx) => {
                const li = document.createElement('li');
                li.className = 'record-item';
                li.innerHTML = `
                    <span class="record-rank">${idx + 1}위</span>
                    <span class="record-name">${escapeHtml(rec.name)}</span>
                    <span class="record-score">${rec.streak}연승</span>
                    <span class="record-date" style="font-size: 11px; color: #888; white-space: nowrap;">${rec.date}</span>
                `;
                ul.appendChild(li);
            });
        },
        error: function(err) {
            console.error("리더보드 불러오기 오류:", err);
            document.getElementById('record-list-ul').innerHTML = 
                '<li style="text-align:center; padding: 10px; color:#7f8c8d;">리더보드를 불러오는 데 실패했습니다.</li>';
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
                    alert('🔓 히든 패 분석기 모드가 활성화되었습니다!');
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
   히든 분석기 및 퀴즈 로직 (기존 동일)
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
        alert('패는 최대 13장까지 선택할 수 있습니다.');
        return;
    }
    const count = customHand.filter(x => x === num).length;
    if (count >= 4) {
        alert(`동일한 패(${num})는 최대 4장까지만 추가할 수 있습니다.`);
        return;
    }

    customHand.push(num);
    customHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

function applyCustomTextInput() {
    const input = document.getElementById('custom-text-input').value.trim();
    if (!/^[1-9]{1,13}$/.test(input)) {
        alert('1~9 범위의 숫자만 최대 13자리 입력해 주세요.');
        return;
    }

    let counts = Array(10).fill(0);
    let newHand = [];
    for (let char of input) {
        let n = parseInt(char);
        counts[n]++;
        if (counts[n] > 4) {
            alert(`동일한 숫자(${n})가 4장을 초과할 수 없습니다.`);
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
        container.innerHTML = `<span style="color:#a3b18a; font-size:14px;">1~9 패 선택 버튼을 누르거나 숫자를 입력하세요.</span>`;
        return;
    }

    for (let i = 0; i < customHand.length; i++) {
        const num = customHand[i];
        const img = document.createElement('img');
        img.src = await getTileImageSrc(customSuitCode, num);
        img.className = 'tile-img';
        img.style.cursor = 'pointer';
        img.title = '클릭하면 삭제됩니다';
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
        alert(`패는 정확히 13장이어야 계산이 가능합니다. (현재: ${customHand.length}장)`);
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

    let actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : '노텐 (대기패 없음)';
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">💡 량페코(兩盃口) 형태가 포함된 손패입니다.</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">💡 치또이즈(七対子) 형태의 단기대기 손패입니다.</div><br>`;
    }

    let htmlStr = '';
    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        htmlStr = `${tagNotice}<b>실제 대기패:</b> [ ${actualStr} ] &nbsp;|&nbsp; <b>이론상 대기패:</b> [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">(※ ${maxedOutWinningTiles.join(', ')}번 패는 4장 사용 중으로 화료 불가)</small>`;
    } else {
        htmlStr = `${tagNotice}<b>실제 대기패:</b> [ ${actualStr} ]`;
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
        if (typeof TRANSLATIONS !== 'undefined' && typeof currentLang !== 'undefined' && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].descriptions) {
            infoBox.innerHTML = TRANSLATIONS[currentLang].descriptions[currentMode] || MODE_DESCRIPTIONS[currentMode];
        } else {
            infoBox.innerHTML = MODE_DESCRIPTIONS[currentMode];
        }
    }
}

function generateQuiz() {
    clearInterval(timerInterval);
    isSubmitted = false;
    selectedTiles.clear();
    document.getElementById('name-input-container').style.display = 'none';

    document.querySelectorAll('.btn-number').forEach(btn => btn.classList.remove('selected'));

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = '제출 및 정답 확인';
    submitBtn.style.backgroundColor = '#27ae60';

    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'none';
    resultDiv.className = 'result-message';

    currentSuitObj = SUITS[Math.floor(Math.random() * SUITS.length)];

    let validHandFound = false;
    while (!validHandFound) {
        currentHand = generateRandomTenpaiHand();
        const resultData = getWinningTiles(currentHand);
        winningTiles = resultData.waits;
        maxedOutWinningTiles = resultData.maxedOut;
        winningDecompositions = resultData.decomps;
        isChiitoiHand = resultData.isChiitoi;
        isRyanpeikouHand = resultData.isRyanpeikou;

        if (winningTiles.length === 0) continue;

        if (currentMode === 'easy' && winningTiles.length <= 2) {
            validHandFound = true;
        } else if (currentMode === 'normal' && winningTiles.length >= 2) {
            validHandFound = true;
        } else if (currentMode === 'hard' && winningTiles.length >= 3) {
            validHandFound = true;
        } else if (currentMode === 'streak' && winningTiles.length >= 3) {
            validHandFound = true;
        }
    }

    updateModeUI();
    renderQuizHand();

    const streakDisplay = document.getElementById('streak-display');
    const timerDisplay = document.getElementById('timer-display');
    const easyHint = document.getElementById('easy-mode-hint');

    if (currentMode === 'streak') {
        streakDisplay.style.display = 'inline-block';
        streakDisplay.innerHTML = `🔥 현재 <b>${streakCount}</b>연승 중`;
        timerDisplay.style.display = 'inline-block';
        easyHint.style.display = 'none';
        startTimer();
    } else {
        streakDisplay.style.display = 'none';
        timerDisplay.style.display = 'none';
        if (currentMode === 'easy') {
            easyHint.style.display = 'block';
            easyHint.innerHTML = `💡 <b>힌트:</b> 총 <b>${winningTiles.length}</b>개의 오름패가 있습니다.`;
        } else {
            easyHint.style.display = 'none';
        }
    }
}

function startTimer() {
    timeLeft = 60;
    const timerElem = document.getElementById('timer-display');
    timerElem.innerHTML = `⏱️ <b>${timeLeft}</b>초`;

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            timerElem.innerHTML = `⏱️ <b>${timeLeft}</b>초`;
        } else {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    isSubmitted = true;
    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message incorrect';
    resultDiv.innerHTML = `⏰ <b>시간 초과로 실패했습니다!</b><br>👉 정답 오름패: [ ${winningTiles.join(', ')} ]`;

    checkStreakRecordAndReset();

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = '다음 연승 문제로 이동';
    submitBtn.style.backgroundColor = '#8e44ad';
}

async function renderQuizHand() {
    const handContainer = document.getElementById('quiz-hand-display');
    handContainer.innerHTML = '';
    for (let num of currentHand) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(currentSuitObj.code, num);
        img.className = 'tile-img';
        handContainer.appendChild(img);
    }
}

function toggleSelect(num, btnElem) {
    if (isSubmitted) return;
    if (selectedTiles.has(num)) {
        selectedTiles.delete(num);
        btnElem.classList.remove('selected');
    } else {
        selectedTiles.add(num);
        btnElem.classList.add('selected');
    }
}

function handleSubmitOrNext() {
    if (isSubmitted) {
        generateQuiz();
    } else {
        checkAnswer();
    }
}

function checkAnswer() {
    if (isSubmitted) return;
    clearInterval(timerInterval);

    const userAnswers = Array.from(selectedTiles).sort((a, b) => a - b);
    const isCorrect = userAnswers.length === winningTiles.length &&
                      userAnswers.every((val, index) => val === winningTiles[index]);

    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'block';

    let answerText = `<b>실제 오름패:</b> [ ${winningTiles.join(', ')} ]`;
    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        answerText += `<br><small style="color:#d35400;">• 이론상 대기패: [ ${theoreticalList.join(', ')} ] (※ ${maxedOutWinningTiles.join(', ')}번 패는 4장 사용 중으로 완성 불가)</small>`;
    }

    if (currentMode !== 'streak') {
        let tagNotice = '';
        if (isRyanpeikouHand) {
            tagNotice = `<div class="special-tag ryanpeikou-tag">💡 이 문제는 량페코(兩盃口) 형태가 포함된 문제입니다.</div>`;
        } else if (isChiitoiHand) {
            tagNotice = `<div class="special-tag chiitoi-tag">💡 이 문제는 청일색과 치또이(七対子)가 조합된 단기대기 문제입니다.</div>`;
        }
        answerText = tagNotice + answerText + renderDecompositionExplanation();
    }

    if (isCorrect) {
        resultDiv.className = 'result-message correct';
        if (currentMode === 'streak') {
            streakCount++;
            resultDiv.innerHTML = `🎉 정답입니다! (${streakCount}연승 성공!)<br>👉 ${answerText}`;
        } else {
            resultDiv.innerHTML = `🎉 정답입니다!<br>👉 ${answerText}`;
        }
    } else {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `❌ 오답입니다.<br>👉 ${answerText}`;
        if (currentMode === 'streak') checkStreakRecordAndReset();
    }

    isSubmitted = true;
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = currentMode === 'streak' ? '다음 연승 문제로 이동' : '같은 난이도로 새 문제 제출';
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
        alert('현재 생성된 문제가 없습니다.');
        return;
    }
    customHand = [...currentHand];
    if (typeof currentSuitObj !== 'undefined' && currentSuitObj && currentSuitObj.code) {
        customSuitCode = currentSuitObj.code;
    }
    
    const analyzer = document.getElementById('hidden-analyzer');
    if (analyzer) {
        analyzer.style.display = 'block';
        updateCustomHandDisplay();
        document.getElementById('custom-text-input').value = customHand.join('');
        analyzer.scrollIntoView({ behavior: 'smooth' });
    }
}

/* -------------------------------------------------------------
   🀄 텐파이 대기패 알고리즘 및 해설 함수 (기존 동일)
------------------------------------------------------------- */
function generateRandomTenpaiHand() {
    while (true) {
        let deck = [];
        for (let i = 1; i <= 9; i++) deck.push(i, i, i, i);
        deck.sort(() => Math.random() - 0.5);

        let hand = deck.slice(0, 13).sort((a, b) => a - b);
        let res = getWinningTiles(hand);
        if (res.waits.length > 0) return hand;
    }
}

function getWinningTiles(hand13) {
    let waits = [];
    let maxedOut = [];
    let decomps = {};
    let isChiitoi = false;
    let isRyanpeikou = false;

    let tileCounts = Array(10).fill(0);
    hand13.forEach(t => tileCounts[t]++);

    for (let t = 1; t <= 9; t++) {
        if (tileCounts[t] >= 4) {
            let tempHand = [...hand13, t].sort((a, b) => a - b);
            let checkRes = checkCompletenessWithDecomp(tempHand);
            if (checkRes.isComplete) {
                maxedOut.push(t);
            }
            continue;
        }

        let tempHand = [...hand13, t].sort((a, b) => a - b);
        let checkRes = checkCompletenessWithDecomp(tempHand);

        if (checkRes.isComplete) {
            waits.push(t);
            decomps[t] = checkRes.decompositions;
            if (checkRes.hasChiitoi) isChiitoi = true;
            if (checkRes.hasRyanpeikou) isRyanpeikou = true;
        }
    }

    return {
        waits: waits,
        maxedOut: maxedOut,
        decomps: decomps,
        isChiitoi: isChiitoi,
        isRyanpeikou: isRyanpeikou
    };
}

function checkCompletenessWithDecomp(hand14) {
    let counts = Array(10).fill(0);
    hand14.forEach(t => counts[t]++);

    let decompositions = [];
    let hasChiitoi = false;
    let hasRyanpeikou = false;

    let pairCount = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] === 2) pairCount++;
    }
    if (pairCount === 7) {
        hasChiitoi = true;
    }

    for (let p = 1; p <= 9; p++) {
        if (counts[p] >= 2) {
            counts[p] -= 2;
            let meldsList = [];
            findMelds(counts, [], meldsList);
            counts[p] += 2;

            if (meldsList.length > 0) {
                meldsList.forEach(melds => {
                    decompositions.push({ head: p, melds: melds });

                    let kotsuList = melds.filter(m => m.type === 'kotsu');
                    let shuntsuList = melds.filter(m => m.type === 'shuntsu');

                    if (shuntsuList.length === 4) {
                        shuntsuList.sort((a, b) => a.start - b.start);
                        if (
                            shuntsuList[0].start === shuntsuList[1].start &&
                            shuntsuList[2].start === shuntsuList[3].start
                        ) {
                            hasRyanpeikou = true;
                        }
                    }
                });
            }
        }
    }

    let uniqueDecomps = [];
    let seenStr = new Set();

    decompositions.forEach(d => {
        let str = `${d.head}|` + d.melds.map(m => `${m.type}-${m.start}`).sort().join(',');
        if (!seenStr.has(str)) {
            seenStr.add(str);
            uniqueDecomps.push(d);
        }
    });

    return {
        isComplete: uniqueDecomps.length > 0 || hasChiitoi,
        decompositions: uniqueDecomps,
        hasChiitoi: hasChiitoi,
        hasRyanpeikou: hasRyanpeikou
    };
}

function findMelds(counts, currentMelds, results) {
    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] > 0) {
            first = i;
            break;
        }
    }

    if (first === 0) {
        results.push([...currentMelds]);
        return;
    }

    if (counts[first] >= 3) {
        counts[first] -= 3;
        currentMelds.push({ type: 'kotsu', start: first });
        findMelds(counts, currentMelds, results);
        currentMelds.pop();
        counts[first] += 3;
    }

    if (first <= 7 && counts[first + 1] > 0 && counts[first + 2] > 0) {
        counts[first]--;
        counts[first + 1]--;
        counts[first + 2]--;
        currentMelds.push({ type: 'shuntsu', start: first });
        findMelds(counts, currentMelds, results);
        currentMelds.pop();
        counts[first] += 1;
        counts[first + 1] += 1;
        counts[first + 2] += 1;
    }
}

function renderDecompositionExplanation() {
    let html = `<div class="explanation-box"><div class="explanation-title">🔍 대기패별 대기 유형 및 손패 구조 해설</div>`;

    for (let tStr in winningDecompositions) {
        let winTile = parseInt(tStr);
        let decomps = winningDecompositions[winTile];

        if (!decomps || decomps.length === 0) {
            if (isChiitoiHand) {
                html += `<div class="decomp-item"><b>[${winTile}번 패]</b>: 칠대자(七対子) 단기대기</div>`;
            }
            continue;
        }

        html += `<div class="decomp-item"><b>[${winTile}번 패 오름]</b>`;
        decomps.forEach((d) => {
            let waitType = classifyWaitType(d, winTile);
            let meldStr = d.melds.map(m => {
                if (m.type === 'kotsu') return `[${m.start}${m.start}${m.start}]`;
                return `[${m.start}${m.start + 1}${m.start + 2}]`;
            }).join(' ');

            html += `<br>&nbsp;&nbsp;• 머리: ${d.head}${d.head} / 몸통: ${meldStr} 👉 <span class="wait-type-tag">${waitType}</span>`;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function classifyWaitType(decomp, winTile) {
    if (decomp.head === winTile) return "단기(単騎)";

    for (let m of decomp.melds) {
        if (m.type === 'kotsu' && m.start === winTile) {
            return "샤보(쌍쌍)";
        }
        if (m.type === 'shuntsu') {
            let s = m.start;
            if (winTile >= s && winTile <= s + 2) {
                if (winTile === s + 1) return "간짱(중앙)";
                if (winTile === s && s === 7) return "변짱(변두리)";
                if (winTile === s + 2 && s === 1) return "변짱(변두리)";
                return "양면";
            }
        }
    }
    return "복합 대기";
}
