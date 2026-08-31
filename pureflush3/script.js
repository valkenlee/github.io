/* =============================================================
   📌 (Last Updated: 2026-08-31)
   ============================================================= */
const APP_VERSION = "0.4.0";
console.log(`[App Initialized] Version: ${APP_VERSION}`);

// ==========================================
// 1. 전역 상태 및 자원 변수
// ==========================================
let tileImages = {}; // 1~9삭 이미지 블롭 저장
let currentMode = 'easy'; // easy, normal, hard, streak
let currentHand = []; // 현재 13장 손패 (숫자 배열)
let winningTiles = []; // 정답 대기패 목록
let maxedOutWinningTiles = []; // 손패에 4장 들어있어 오를 수 없는 이론상 대기패
let isSubmitted = false;
let isRyanpeikouHand = false; // 량페코 포함 여부
let isChiitoiHand = false; // 치또이즈 포함 여부

// 연승 모드 관련 변수
let streakCount = 0;
let streakTimer = null;
let timeLeft = 60;

// ==========================================
// 2. 초기화 및 리소스 로딩 (ZIP 파일 해제)
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    // 저장된 언어 설정 불러오기 및 드롭다운 초기화
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = currentLang;
    }
    applyTranslations();

    loadLeaderboard(); 
    initTitleClickTrigger();
    renderCustomButtons();
    
    try {
        const response = await fetch('Regular.zip');
        if (!response.ok) throw new Error('ZIP 파일을 찾을 수 없습니다.');
        
        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);
        
        // s1.png ~ s9.png 읽어오기
        for (let i = 1; i <= 9; i++) {
            const fileName = `s${i}.png`;
            const file = zip.file(fileName);
            if (file) {
                const imgBlob = await file.async('blob');
                tileImages[i] = URL.createObjectURL(imgBlob);
            } else {
                console.warn(`${fileName} 이 zip 파일 내에 없습니다.`);
            }
        }
        
        const statusMsg = document.getElementById('status-msg');
        if (statusMsg) {
            statusMsg.style.color = '#27ae60';
            statusMsg.innerText = t('loadingSuccess');
        }

        // 난이도 버튼 활성화
        ['btn-mode-easy', 'btn-mode-normal', 'btn-mode-hard', 'btn-mode-streak'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });

        // 기본 모드로 게임 시작
        selectMode('easy');

    } catch (err) {
        console.error(err);
        const statusMsg = document.getElementById('status-msg');
        if (statusMsg) {
            statusMsg.style.color = '#e74c3c';
            statusMsg.innerText = t('loadingError');
        }
    }
});

// 키보드 단축키 처리 (1~9: 숫자 체크, Enter: 제출/다음)
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        const checkbox = document.getElementById(`chk-tile-${num}`);
        if (checkbox && !checkbox.disabled) {
            checkbox.checked = !checkbox.checked;
            toggleTileBtnStyle(num, checkbox.checked);
        }
    } else if (e.key === 'Enter') {
        const streakModal = document.getElementById('streak-start-modal');
        const hofModal = document.getElementById('hof-input-modal');
        
        if (streakModal && streakModal.style.display === 'flex') {
            confirmStartStreak();
        } else if (hofModal && hofModal.style.display === 'flex') {
            submitHallOfFame();
        } else {
            handleSubmitOrNext();
        }
    }
});

// ==========================================
// 3. 모드 선택 및 UI 갱신
// ==========================================
function selectMode(mode) {
    if (mode === 'streak' && currentMode !== 'streak') {
        showStreakStartModal();
        return;
    }

    currentMode = mode;
    
    // 버튼 스타일 active 처리
    ['easy', 'normal', 'hard', 'streak'].forEach(m => {
        const btn = document.getElementById(`btn-mode-${m}`);
        if (btn) {
            if (m === mode) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    updateModeUI();

    if (mode !== 'streak') {
        stopStreakTimer();
        streakCount = 0;
        generateQuiz();
    }
}

function updateModeUI() {
    const infoBox = document.getElementById('mode-info-box');
    if (infoBox) {
        infoBox.innerHTML = TRANSLATIONS[currentLang]?.descriptions[currentMode] || '';
        infoBox.style.display = 'block';
    }

    const streakCountElem = document.getElementById('streak-count-display');
    const timerElem = document.getElementById('timer-display');

    if (currentMode === 'streak') {
        if (streakCountElem) {
            streakCountElem.style.display = 'inline-block';
            streakCountElem.innerText = t('streakCount', { count: streakCount });
        }
        if (timerElem) {
            timerElem.style.display = 'inline-block';
            updateTimerDisplay();
        }
    } else {
        if (streakCountElem) streakCountElem.style.display = 'none';
        if (timerElem) timerElem.style.display = 'none';
    }
}

// ==========================================
// 4. 연승 모드 타이머 및 모달 처리
// ==========================================
function showStreakStartModal() {
    const modal = document.getElementById('streak-start-modal');
    if (modal) modal.style.display = 'flex';
}

function confirmStartStreak() {
    const modal = document.getElementById('streak-start-modal');
    if (modal) modal.style.display = 'none';

    currentMode = 'streak';
    ['easy', 'normal', 'hard', 'streak'].forEach(m => {
        const btn = document.getElementById(`btn-mode-${m}`);
        if (btn) {
            if (m === 'streak') btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    streakCount = 0;
    updateModeUI();
    generateQuiz();
    startStreakTimer();
}

function startStreakTimer() {
    stopStreakTimer();
    timeLeft = 60;
    updateTimerDisplay();

    streakTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            stopStreakTimer();
            handleStreakTimeout();
        }
    }, 1000);
}

function stopStreakTimer() {
    if (streakTimer) {
        clearInterval(streakTimer);
        streakTimer = null;
    }
}

function updateTimerDisplay() {
    const timerElem = document.getElementById('timer-display');
    if (timerElem) {
        timerElem.innerText = t('timerSeconds', { count: timeLeft });
    }
}

function handleStreakTimeout() {
    isSubmitted = true;
    disableAnswerInputs();

    const resultDiv = document.getElementById('result-message');
    if (resultDiv) {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `${t('timeout')}<br>👉 ${getAnswerString()}`;
    }

    checkStreakHallOfFameEligibility();

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) submitBtn.innerText = t('btnNextStreak');
}

// ==========================================
// 5. 마작 청일색 알고리즘 엔진
// ==========================================
function generateQuiz() {
    isSubmitted = false;
    resetInputUI();

    let found = false;
    let attempts = 0;

    while (!found && attempts < 2000) {
        attempts++;
        const candidateHand = generateRandom13Tiles();
        const rawWaits = calculateWaits(candidateHand);

        if (rawWaits.length === 0) continue;

        // 손패 내 각 패의 개수 세기
        const counts = {};
        candidateHand.forEach(num => counts[num] = (counts[num] || 0) + 1);

        // 실제 대기패(4장 사용 안 된 패)와 4장 다 쓴 이론상 대기패 분리
        const validWaits = rawWaits.filter(num => (counts[num] || 0) < 4);
        const maxedWaits = rawWaits.filter(num => (counts[num] || 0) === 4);

        if (validWaits.length === 0) continue;

        // 특수 역 점검 (량페코 / 치또이)
        const checkRyanpeikou = isRyanpeikou(candidateHand);
        const checkChiitoi = isChiitoiTenpai(candidateHand);

        // 난이도 필터링
        if (currentMode === 'easy') {
            if (validWaits.length >= 1 && validWaits.length <= 2) {
                currentHand = candidateHand;
                winningTiles = validWaits;
                maxedOutWinningTiles = maxedWaits;
                isRyanpeikouHand = checkRyanpeikou;
                isChiitoiHand = checkChiitoi;
                found = true;
            }
        } else if (currentMode === 'normal') {
            if (validWaits.length === 2) {
                currentHand = candidateHand;
                winningTiles = validWaits;
                maxedOutWinningTiles = maxedWaits;
                isRyanpeikouHand = checkRyanpeikou;
                isChiitoiHand = checkChiitoi;
                found = true;
            }
        } else if (currentMode === 'hard' || currentMode === 'streak') {
            if (validWaits.length >= 3) {
                currentHand = candidateHand;
                winningTiles = validWaits;
                maxedOutWinningTiles = maxedWaits;
                isRyanpeikouHand = checkRyanpeikou;
                isChiitoiHand = checkChiitoi;
                found = true;
            }
        }
    }

    if (!found) {
        // 폴백 기본 텐파이 손패
        currentHand = [1,1,1,2,3,4,5,6,7,8,9,9,9];
        winningTiles = [1,2,3,4,5,6,7,8,9];
        maxedOutWinningTiles = [];
        isRyanpeikouHand = false;
        isChiitoiHand = false;
    }

    renderHandTiles();

    // 쉬움 모드 힌트 표시
    const hintElem = document.getElementById('easy-mode-hint');
    if (hintElem) {
        if (currentMode === 'easy') {
            hintElem.innerText = t('hintEasy', { count: winningTiles.length });
            hintElem.style.display = 'inline-block';
        } else {
            hintElem.style.display = 'none';
        }
    }

    if (currentMode === 'streak') {
        startStreakTimer();
    }
}

// 랜딜 13장 생성 (각 패 최대 4장 제한)
function generateRandom13Tiles() {
    const pool = [];
    for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 4; j++) pool.push(i);
    }
    
    // Fisher-Yates 셔플
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    return pool.slice(0, 13).sort((a, b) => a - b);
}

// 14장 완공(오름) 검사 (4멘츠 1작두 또는 치또이즈)
function isWinningHand(tiles14) {
    if (tiles14.length !== 14) return false;

    // 1. 치또이즈 검사 (7쌍)
    const counts = {};
    tiles14.forEach(x => counts[x] = (counts[x] || 0) + 1);
    const pairs = Object.values(counts).filter(c => c === 2).length;
    if (pairs === 7) return true;

    // 2. 일반 형태 검사 (4멘츠 + 1작두)
    return checkStandardAgari(counts);
}

function checkStandardAgari(countsObj) {
    const counts = { ...countsObj };
    
    // 작두(머리) 후보 선정
    for (let i = 1; i <= 9; i++) {
        if (counts[i] >= 2) {
            counts[i] -= 2;
            if (canFormMentsu(counts, 0)) return true;
            counts[i] += 2; // 원복
        }
    }
    return false;
}

function canFormMentsu(counts, MentsuCount) {
    if (MentsuCount === 4) return true;

    // 남아있는 첫 번째 패 찾기
    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] > 0) {
            first = i;
            break;
        }
    }
    if (first === 0) return true;

    // 커츠(刻子) 시도
    if (counts[first] >= 3) {
        counts[first] -= 3;
        if (canFormMentsu(counts, MentsuCount + 1)) return true;
        counts[first] += 3;
    }

    // 슌츠(順子) 시도
    if (first <= 7 && counts[first + 1] > 0 && counts[first + 2] > 0) {
        counts[first]--;
        counts[first + 1]--;
        counts[first + 2]--;
        if (canFormMentsu(counts, MentsuCount + 1)) return true;
        counts[first]++;
        counts[first + 1]++;
        counts[first + 2]++;
    }

    return false;
}

// 13장 손패의 오름패 계산
function calculateWaits(tiles13) {
    const waits = [];
    for (let tile = 1; tile <= 9; tile++) {
        const testHand = [...tiles13, tile].sort((a, b) => a - b);
        if (isWinningHand(testHand)) {
            waits.push(tile);
        }
    }
    return waits;
}

// 특수 형태 검사
function isRyanpeikou(hand13) {
    // 량페코는 동일한 슌츠 2쌍이 2개 존재하는 14장 형태
    for (let t = 1; t <= 9; t++) {
        const test = [...hand13, t].sort((a, b) => a - b);
        if (!isWinningHand(test)) continue;

        const counts = {};
        test.forEach(x => counts[x] = (counts[x] || 0) + 1);

        // 머리 후보
        for (let head = 1; head <= 9; head++) {
            if (counts[head] >= 2) {
                counts[head] -= 2;
                if (checkRyanpeikouMentsu(counts)) return true;
                counts[head] += 2;
            }
        }
    }
    return false;
}

function checkRyanpeikouMentsu(countsObj) {
    const c = { ...countsObj };
    let shuntsuList = [];

    for (let i = 1; i <= 7; i++) {
        while (c[i] > 0 && c[i+1] > 0 && c[i+2] > 0) {
            shuntsuList.push(i);
            c[i]--; c[i+1]--; c[i+2]--;
        }
    }

    if (Object.values(c).some(val => val > 0)) return false;
    if (shuntsuList.length !== 4) return false;

    // 4개의 슌츠가 2개씩 한 쌍을 이루는지 확인
    shuntsuList.sort((a, b) => a - b);
    return (shuntsuList[0] === shuntsuList[1] && shuntsuList[2] === shuntsuList[3]);
}

function isChiitoiTenpai(hand13) {
    const counts = {};
    hand13.forEach(x => counts[x] = (counts[x] || 0) + 1);
    const pairs = Object.values(counts).filter(c => c === 2).length;
    const singles = Object.values(counts).filter(c => c === 1).length;
    return (pairs === 6 && singles === 1);
}

// ==========================================
// 6. 렌더링 및 UI 연동
// ==========================================
function renderHandTiles() {
    const container = document.getElementById('hand-tiles-container');
    if (!container) return;
    container.innerHTML = '';

    currentHand.forEach(num => {
        const img = document.createElement('img');
        img.src = tileImages[num] || '';
        img.alt = `${num}삭`;
        img.className = 'tile-img';
        container.appendChild(img);
    });
}

function resetInputUI() {
    for (let i = 1; i <= 9; i++) {
        const chk = document.getElementById(`chk-tile-${i}`);
        const btn = document.getElementById(`btn-tile-choice-${i}`);
        if (chk) {
            chk.checked = false;
            chk.disabled = false;
        }
        if (btn) btn.classList.remove('selected');
    }

    const resultDiv = document.getElementById('result-message');
    if (resultDiv) {
        resultDiv.className = 'result-message';
        resultDiv.innerHTML = '';
    }

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) submitBtn.innerText = t('btnSubmit');
}

function toggleTileBtnStyle(num, isChecked) {
    const btn = document.getElementById(`btn-tile-choice-${num}`);
    if (btn) {
        if (isChecked) btn.classList.add('selected');
        else btn.classList.remove('selected');
    }
}

function disableAnswerInputs() {
    for (let i = 1; i <= 9; i++) {
        const chk = document.getElementById(`chk-tile-${i}`);
        if (chk) chk.disabled = true;
    }
}

function handleSubmitOrNext() {
    if (isSubmitted) {
        // 다음 문제 제출
        generateQuiz();
        return;
    }

    // 답안 제출 검사
    const userAnswers = [];
    for (let i = 1; i <= 9; i++) {
        const chk = document.getElementById(`chk-tile-${i}`);
        if (chk && chk.checked) userAnswers.push(i);
    }

    // 정답 일치 확인
    const isCorrect = (userAnswers.length === winningTiles.length) &&
        userAnswers.every((val, idx) => val === winningTiles[idx]);

    isSubmitted = true;
    disableAnswerInputs();

    if (currentMode === 'streak') {
        stopStreakTimer();
    }

    const resultDiv = document.getElementById('result-message');
    const answerText = getAnswerString();

    if (isCorrect) {
        if (resultDiv) {
            resultDiv.className = 'result-message correct';
            resultDiv.innerHTML = `${t('correct')}<br>👉 ${answerText}`;
        }
        if (currentMode === 'streak') {
            streakCount++;
            const streakDisplay = document.getElementById('streak-count-display');
            if (streakDisplay) streakDisplay.innerText = t('streakCount', { count: streakCount });
        }
    } else {
        if (resultDiv) {
            resultDiv.className = 'result-message incorrect';
            resultDiv.innerHTML = `${t('incorrect')}<br>👉 ${answerText}`;
        }
        if (currentMode === 'streak') {
            checkStreakHallOfFameEligibility();
        }
    }

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        submitBtn.innerText = currentMode === 'streak' ? t('btnNextStreak') : t('btnNextSame');
    }
}

function getAnswerString() {
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">${t('ryanpeikouNotice')}</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">${t('chiitoiNotice')}</div><br>`;
    }

    const actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : 'None';
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

// ==========================================
// 7. 대기패 분석 및 해설 생성
// ==========================================
function getWaitTypeBadgeHtml(waitType) {
    let label = waitType;
    if (waitType === '양면') label = t('waitRyanmen');
    else if (waitType === '단기') label = t('waitTanki');
    else if (waitType === '샤보') label = t('waitShanpon');
    else if (waitType === '간짱') label = t('waitKanchan');
    else if (waitType === '변짱') label = t('waitPenchan');

    return `<span class="wait-type-badge badge-ryanmen">${label}</span>`;
}

function renderDecompositionExplanation() {
    let html = `<div class="explanation-box">`;
    html += `<h4>${t('explanationTitle')}</h4>`;

    const allPossibleWaits = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);

    allPossibleWaits.forEach(waittile => {
        const testHand = [...currentHand, waittile].sort((a, b) => a - b);
        const structures = decomposeHandForWaitTile(testHand, waittile);

        html += `<div class="wait-tile-explain">`;
        html += `<strong>🀄 [ ${waittile} ] ${t('actualWaits')}:</strong><br>`;

        if (structures.length === 0) {
            html += `<span class="decomp-line">• 특수 오름 형태</span><br>`;
        } else {
            structures.forEach(st => {
                const badge = getWaitTypeBadgeHtml(st.waitType);
                html += `<div class="decomp-line">• ${badge} <b>${st.groups.join(' ')}</b> (대기: ${st.waitingMentsu})</div>`;
            });
        }
        html += `</div>`;
    });

    html += `</div>`;
    return html;
}

function decomposeHandForWaitTile(hand14, waitTile) {
    const counts = {};
    hand14.forEach(x => counts[x] = (counts[x] || 0) + 1);

    const results = [];

    // 작두 선정
    for (let head = 1; head <= 9; head++) {
        if (counts[head] >= 2) {
            counts[head] -= 2;
            const mentsuList = [];
            findAllMentsuCombinations(counts, 0, mentsuList, head, waitTile, results);
            counts[head] += 2;
        }
    }

    // 중복 제거
    const uniqueMap = new Map();
    results.forEach(item => {
        const key = `${item.waitType}-${item.groups.join('-')}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
        }
    });

    return Array.from(uniqueMap.values());
}

function findAllMentsuCombinations(counts, MentsuCount, currentMentsu, headTile, waitTile, results) {
    if (MentsuCount === 4) {
        // 분석 완료: 완성된 4개 멘츠 + 작두 중에서 waitTile이 포함된 멘츠/작두 찾기
        const handGroups = [`[${headTile}${headTile}]`, ...currentMentsu];
        analyzeWaitTypeForTile(currentMentsu, headTile, waitTile, handGroups, results);
        return;
    }

    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] > 0) {
            first = i;
            break;
        }
    }
    if (first === 0) return;

    // 커츠 시도
    if (counts[first] >= 3) {
        counts[first] -= 3;
        currentMentsu.push(`(${first}${first}${first})`);
        findAllMentsuCombinations(counts, MentsuCount + 1, currentMentsu, headTile, waitTile, results);
        currentMentsu.pop();
        counts[first] += 3;
    }

    // 슌츠 시도
    if (first <= 7 && counts[first + 1] > 0 && counts[first + 2] > 0) {
        counts[first]--;
        counts[first + 1]--;
        counts[first + 2]--;
        currentMentsu.push(`(${first}${first+1}${first+2})`);
        findAllMentsuCombinations(counts, MentsuCount + 1, currentMentsu, headTile, waitTile, results);
        currentMentsu.pop();
        counts[first]++;
        counts[first + 1]++;
        counts[first + 2]++;
    }
}

function analyzeWaitTypeForTile(mentsuList, headTile, waitTile, handGroups, results) {
    // 1. 단기대기 (작두가 완성된 오름패인 경우)
    if (headTile === waitTile) {
        results.push({
            waitType: '단기',
            groups: handGroups,
            waitingMentsu: `작두 [${waitTile}] 단기`
        });
    }

    // 2. 멘츠 내 대기 형태 분류
    mentsuList.forEach(mStr => {
        if (mStr.includes(`${waitTile}`)) {
            const nums = mStr.replace(/[()]/g, '').split('').map(Number);
            
            // 커츠 형태면 샤보대기
            if (nums[0] === nums[1] && nums[1] === nums[2]) {
                results.push({
                    waitType: '샤보',
                    groups: handGroups,
                    waitingMentsu: `쌍봉 (${waitTile}${waitTile})`
                });
            } else {
                // 슌츠 형태 (양면, 간짱, 변짱)
                if (nums[0] === waitTile) {
                    if (waitTile === 7 && nums[1] === 8 && nums[2] === 9) {
                        results.push({ waitType: '변짱', groups: handGroups, waitingMentsu: `(89) 변짱` });
                    } else {
                        results.push({ waitType: '양면', groups: handGroups, waitingMentsu: `(${nums[1]}${nums[2]}) 양면` });
                    }
                } else if (nums[2] === waitTile) {
                    if (waitTile === 3 && nums[0] === 1 && nums[1] === 2) {
                        results.push({ waitType: '변짱', groups: handGroups, waitingMentsu: `(12) 변짱` });
                    } else {
                        results.push({ waitType: '양면', groups: handGroups, waitingMentsu: `(${nums[0]}${nums[1]}) 양면` });
                    }
                } else if (nums[1] === waitTile) {
                    results.push({ waitType: '간짱', groups: handGroups, waitingMentsu: `(${nums[0]}${nums[2]}) 간짱` });
                }
            }
        }
    });
}

// ==========================================
// 8. 명예의 전당 (리더보드) & 트리거
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQpW_Z9wL--1wQeT1mXG4f9P1Z8rL9x-J3180/exec"; // 사용자의 Apps Script URL

async function loadLeaderboard() {
    const listElem = document.getElementById('hof-list');
    if (!listElem) return;

    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        
        listElem.innerHTML = '';
        if (!data || data.length === 0) {
            listElem.innerHTML = '<li style="text-align:center; color:#7f8c8d;">등록된 기록이 없습니다.</li>';
            return;
        }

        data.slice(0, 10).forEach((item, index) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.padding = '6px 10px';
            li.style.borderBottom = '1px solid #eee';

            const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            li.innerHTML = `<span><b>${rankBadge} ${escapeHtml(item.name)}</b></span> <span><b style="color:#e67e22;">${item.score}</b> 연승 (${item.date || ''})</span>`;
            listElem.appendChild(li);
        });
    } catch (err) {
        console.error('리더보드 로드 실패:', err);
        listElem.innerHTML = '<li style="text-align:center; color:#e74c3c;">리더보드를 불러오지 못했습니다.</li>';
    }
}

function checkStreakHallOfFameEligibility() {
    if (streakCount >= 10) {
        const modal = document.getElementById('hof-input-modal');
        const scoreElem = document.getElementById('modal-streak-score');
        if (scoreElem) scoreElem.innerText = streakCount;
        if (modal) modal.style.display = 'flex';
    }
}

async function submitHallOfFame() {
    const nameInput = document.getElementById('input-hof-name');
    const name = nameInput ? nameInput.value.trim() : '';
    const modal = document.getElementById('hof-input-modal');

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name || 'Anonymous', score: streakCount })
        });
    } catch (e) {
        console.error('기록 등록 중 오류:', e);
    }

    if (modal) modal.style.display = 'none';
    streakCount = 0;
    loadLeaderboard();
}

function initTitleClickTrigger() {
    let clickCount = 0;
    let timer = null;
    const titleIcon = document.getElementById('title-icon');

    if (titleIcon) {
        titleIcon.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 1) {
                timer = setTimeout(() => { clickCount = 0; }, 2000);
            } else if (clickCount >= 5) {
                clearTimeout(timer);
                clickCount = 0;
                toggleCustomTriggerBtn();
            }
        });
    }
}

function toggleCustomTriggerBtn() {
    const area = document.getElementById('custom-trigger-area');
    if (area) {
        area.style.display = area.style.display === 'none' ? 'block' : 'none';
    }
}

function renderCustomButtons() {
    // 필요한 커스텀 버튼 추가 처리
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
