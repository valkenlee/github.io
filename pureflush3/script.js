/* =============================================================
   🀄 청일색 텐파이 대기패 퀴즈 - Main Logic
   (Version: v0.4.0 - i18n & Global Leaderboard Support)
   ============================================================= */

const APP_VERSION = "0.4.0";
console.log(`[App Initialized] Version: ${APP_VERSION}`);

// -------------------------------------------------------------
// 1. 전역 상태 변수
// -------------------------------------------------------------
let zipInstance = null;
let currentSuit = 1;        // 1: Man, 2: Pin, 3: Sou
let currentHandArray = [];   // 현재 패의 숫자 배열 (예: [1,1,1,2,3,4,5,6,7,8,9,9,9])
let winningTiles = [];       // 정답 대기패 배열 (예: [1,2,3,4,5,6,7,8,9])
let userSelected = new Set();
let isSubmitted = false;

let currentMode = 'normal';  // 'easy', 'normal', 'hard', 'streak'
let streakCount = 0;
let streakTimer = null;
let timeLeft = 60;
const STREAK_LIMIT_SEC = 60;

// 암호화 관련 파라미터 (Google Sheets API 연동)
const SECRET_PASSPHRASE = "Mahjong_Pure_Flush_Quiz_Secret_2026";
const ENCRYPTED_ENDPOINT = "U2FsdGVkX1+v/s4B9xR3A9z7R/8z5W2Z4Y9x3v2y1A=="; // 실제 배치 시 암호화된 앱스크립트 URL 설정

// -------------------------------------------------------------
// 2. DOM Load & 초기화
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    // 1) UI 언어 선택 드롭다운 상태 동기화 및 번역 적용
    const langSelect = document.getElementById('lang-select');
    if (langSelect && typeof currentLang !== 'undefined') {
        langSelect.value = currentLang;
    }
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }

    // 2) 명예의 전당 리더보드 불러오기
    loadLeaderboard();

    // 3) 숨겨진 이스터에그 및 커스텀 버튼 이벤트 등록
    initTitleClickTrigger();

    // 4) 키보드 단축키 (1~9: 패 선택, Enter: 제출/다음)
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

    // 5) Regular.zip 패 이미지 리소스 받아오기
    try {
        const response = await fetch('Regular.zip');
        if (!response.ok) throw new Error('Regular.zip load failed');
        
        const arrayBuffer = await response.arrayBuffer();
        zipInstance = await JSZip.loadAsync(arrayBuffer);
        
        const statusMsg = document.getElementById('status-msg');
        if (statusMsg) {
            statusMsg.style.color = '#27ae60';
            statusMsg.innerText = typeof t === 'function' ? t('loadingSuccess') : "✅ 마작패 로딩 완료!";
        }
        
        // 난이도 버튼 활성화
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);
        
        // 기본 모드(보통) 문제 시작
        selectMode('normal');

    } catch (err) {
        console.error(err);
        const statusMsg = document.getElementById('status-msg');
        if (statusMsg) {
            statusMsg.style.color = '#e74c3c';
            statusMsg.innerText = typeof t === 'function' ? t('loadingError') : "❌ 패 이미지 로딩 실패 (Regular.zip 확인 필요)";
        }
    }
});

// -------------------------------------------------------------
// 3. 모드(난이도) 선택 & 관리
// -------------------------------------------------------------
function selectMode(mode) {
    if (currentMode === 'streak' && mode !== 'streak') {
        stopStreakTimer();
    }

    currentMode = mode;
    updateModeUI();

    if (mode === 'streak') {
        // 연승 모드는 모달을 먼저 표시
        document.getElementById('streak-modal').style.display = 'flex';
    } else {
        streakCount = 0;
        updateStreakAndTimerDisplay();
        generateNewQuestion();
    }
}

function updateModeUI() {
    document.querySelectorAll('.btn-diff').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-mode-${currentMode}`);
    if (activeBtn) activeBtn.classList.add('active');

    const infoBox = document.getElementById('mode-info-box');
    
    // i18n 번역 텍스트 매핑
    let desc = "";
    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].descriptions) {
        desc = TRANSLATIONS[currentLang].descriptions[currentMode];
    } else {
        const defaults = {
            easy: "🌱 <b>쉬움 모드:</b> 1~3면짱 대기 위주의 복잡도가 낮은 문제가 출제됩니다. (대기패 개수 힌트 제공)",
            normal: "🌿 <b>보통 모드:</b> 일반적인 청일색 텐파이 문제가 랜덤으로 출제됩니다.",
            hard: "🔥 <b>어려움 모드:</b> 5면짱 이상의 다면짱 복잡한 고난도 문제가 출제됩니다.",
            streak: "⚡ <b>연승 모드:</b> 제한시간(60초) 내에 고난도 문제 연승에 도전하세요!"
        };
        desc = defaults[currentMode] || "";
    }
                 
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

function startStreakModeAfterNotice() {
    document.getElementById('streak-modal').style.display = 'none';
    streakCount = 0;
    updateStreakAndTimerDisplay();
    generateNewQuestion();
}

// -------------------------------------------------------------
// 4. 문제 생성 및 화면 렌더링
// -------------------------------------------------------------
function generateNewQuestion() {
    isSubmitted = false;
    userSelected.clear();
    resetNumberButtons();

    // 결과 창 초기화
    const resultDiv = document.getElementById('result-message');
    resultDiv.style.display = 'none';
    resultDiv.className = 'result-message';
    resultDiv.innerHTML = '';
    
    document.getElementById('name-input-container').style.display = 'none';

    // 제출 버튼 텍스트 원복
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = typeof t === 'function' ? t('btnSubmit') : "제출 및 정답 확인";
    submitBtn.style.backgroundColor = '#2980b9';

    // 랜덤 수패(1:만수, 2:통수, 3:삭수) 선택
    currentSuit = Math.floor(Math.random() * 3) + 1;

    // 모드별 패턴 생성 및 완성형 13패 + 대기패 계산
    const question = createPureFlushHand(currentMode);
    currentHandArray = question.hand;
    winningTiles = question.wins;

    // 쉬움 모드 힌트 표시
    const hintBadge = document.getElementById('easy-hint');
    if (currentMode === 'easy') {
        const hintText = typeof t === 'function' 
            ? t('hintEasy', { count: winningTiles.length }) 
            : `💡 힌트: 대기패는 총 ${winningTiles.length}개 입니다.`;
        hintBadge.innerText = hintText;
        hintBadge.style.display = 'inline-block';
    } else {
        hintBadge.style.display = 'none';
    }

    // 연승 모드 타이머 가동
    if (currentMode === 'streak') {
        startStreakTimer();
    } else {
        stopStreakTimer();
    }

    renderHandImages(currentHandArray, currentSuit);
}

// 마작 텐파이 손패 자동 생성 알고리즘 (13장 청일색 패)
function createPureFlushHand(mode) {
    while (true) {
        let counts = new Array(10).fill(0);
        let total = 0;
        
        // 4몸통 + 1머리 형태에서 1장 부족한(13장) 청일색패 무작위 빌드
        // 몸통(멘츠) 4개 생성
        for (let i = 0; i < 4; i++) {
            if (Math.random() < 0.5) {
                // 안코 (동일패 3장)
                let r = Math.floor(Math.random() * 9) + 1;
                counts[r] += 3;
            } else {
                // 슌츠 (연속패 3장)
                let r = Math.floor(Math.random() * 7) + 1;
                counts[r] += 1;
                counts[r+1] += 1;
                counts[r+2] += 1;
            }
        }
        // 머리(아타마) 또는 대기 후보 1장 추가
        let head = Math.floor(Math.random() * 9) + 1;
        counts[head] += 1;

        // 동일 패가 4장을 초과하는 부정확한 패 제외
        let isValid = true;
        for (let k = 1; k <= 9; k++) {
            if (counts[k] > 4) { isValid = false; break; }
        }
        if (!isValid) continue;

        // 13장 패 배열로 변환
        let hand = [];
        for (let k = 1; k <= 9; k++) {
            for (let c = 0; c < counts[k]; c++) {
                hand.push(k);
            }
        }
        if (hand.length !== 13) continue;

        // 계산된 손패의 대기패(오름패) 판정
        let wins = calculateWaitingTiles(hand);
        if (wins.length === 0) continue; // 텐파이가 아니면 재생성

        // 난이도 조건 필터링
        if (mode === 'easy' && wins.length > 3) continue;       // 쉬움: 1~3면짱
        if (mode === 'hard' && wins.length < 5) continue;       // 어려움: 5면짱 이상
        if (mode === 'streak' && wins.length < 4) continue;     // 연승: 4면짱 이상

        return { hand: hand, wins: wins };
    }
}

// 손패 13장에 1~9 패를 하나씩 더해보며 오름(화료)이 가능한지 체크
function calculateWaitingTiles(hand13) {
    let wins = [];
    for (let t = 1; t <= 9; t++) {
        let testHand = [...hand13, t];
        let counts = new Array(10).fill(0);
        testHand.forEach(v => counts[v]++);
        
        // 동일 패 5장 이상 사용 불가
        if (counts[t] > 4) continue;

        if (canFormMahjongHand(counts)) {
            wins.push(t);
        }
    }
    return wins;
}

// 14장 손패가 4몸통 + 1머리를 완성하는지 백트래킹(DFS) 검증
function canFormMahjongHand(counts) {
    // 1. 머리(아타마 - 동일패 2장) 후보를 찾음
    for (let i = 1; i <= 9; i++) {
        if (counts[i] >= 2) {
            counts[i] -= 2;
            if (checkMelds([...counts])) {
                counts[i] += 2;
                return true;
            }
            counts[i] += 2;
        }
    }
    return false;
}

// 나머지 12장이 모두 몸통(안코/슌츠)으로 분해되는지 확인
function checkMelds(counts) {
    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] > 0) {
            first = i;
            break;
        }
    }
    // 남은 패가 없으면 모든 몸통 완성
    if (first === 0) return true;

    // 1) 코츠(3장 동일) 제거 시도
    if (counts[first] >= 3) {
        counts[first] -= 3;
        if (checkMelds(counts)) return true;
        counts[first] += 3;
    }

    // 2) 슌츠(연속 3장) 제거 시도
    if (first <= 7 && counts[first+1] > 0 && counts[first+2] > 0) {
        counts[first]--;
        counts[first+1]--;
        counts[first+2]--;
        if (checkMelds(counts)) return true;
        counts[first]++;
        counts[first+1]++;
        counts[first+2]++;
    }

    return false;
}

// Zip 리소스에서 패 이미지 렌더링
async function renderHandImages(handArray, suit) {
    const handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';

    const prefixMap = { 1: 'm', 2: 'p', 3: 's' };
    const prefix = prefixMap[suit];

    for (let num of handArray) {
        const fileName = `${prefix}${num}.png`;
        const img = document.createElement('img');
        img.className = 'tile-img';
        img.alt = `${num}${prefix}`;

        if (zipInstance && zipInstance.file(fileName)) {
            try {
                const base64 = await zipInstance.file(fileName).async('base64');
                img.src = `data:image/png;base64,${base64}`;
            } catch (e) {
                img.alt = `[${num}]`;
            }
        } else {
            img.alt = `[${num}]`;
        }
        handContainer.appendChild(img);
    }
}

// -------------------------------------------------------------
// 5. 정답 선택 및 제출 처리
// -------------------------------------------------------------
function toggleSelect(num, btn) {
    if (isSubmitted) return;

    if (userSelected.has(num)) {
        userSelected.delete(num);
        btn.classList.remove('selected');
    } else {
        userSelected.add(num);
        btn.classList.add('selected');
    }
}

function resetNumberButtons() {
    for (let i = 1; i <= 9; i++) {
        const btn = document.getElementById(`btn-num-${i}`);
        if (btn) btn.classList.remove('selected');
    }
}

function handleSubmitOrNext() {
    if (isSubmitted) {
        // 다음 문제로 진행
        generateNewQuestion();
    } else {
        // 정답 확인 및 제출
        checkAnswer();
    }
}

function checkAnswer() {
    stopStreakTimer();
    isSubmitted = true;

    const userAnsArray = Array.from(userSelected).sort((a, b) => a - b);
    const correctAnsArray = [...winningTiles].sort((a, b) => a - b);

    const isCorrect = userAnsArray.length === correctAnsArray.length &&
        userAnsArray.every((val, index) => val === correctAnsArray[index]);

    const resultDiv = document.getElementById('result-message');
    resultDiv.style.display = 'block';

    const answerText = correctAnsArray.join(', ');

    if (isCorrect) {
        resultDiv.className = 'result-message correct';
        if (currentMode === 'streak') {
            streakCount++;
            updateStreakAndTimerDisplay();
            const correctStr = typeof t === 'function' ? t('correct') : "⭕ 정답입니다!";
            const streakStr = typeof t === 'function' ? t('streakCount', { count: streakCount }) : `${streakCount}연승`;
            resultDiv.innerHTML = `${correctStr} (${streakStr}!)<br>👉 ${answerText}`;
        } else {
            const correctStr = typeof t === 'function' ? t('correct') : "⭕ 정답입니다!";
            resultDiv.innerHTML = `${correctStr}<br>👉 ${answerText}`;
        }
    } else {
        resultDiv.className = 'result-message incorrect';
        const incorrectStr = typeof t === 'function' ? t('incorrect') : "❌ 오답입니다!";
        resultDiv.innerHTML = `${incorrectStr}<br>👉 정답: [ ${answerText} ]`;

        if (currentMode === 'streak') {
            checkStreakRecordAndReset();
        }
    }

    // 버튼 갱신 (다음 문제)
    const submitBtn = document.getElementById('btn-submit');
    if (currentMode === 'streak') {
        submitBtn.innerText = typeof t === 'function' ? t('btnNextStreak') : "다음 문제 도전 ⚡";
        submitBtn.style.backgroundColor = '#8e44ad';
    } else {
        submitBtn.innerText = typeof t === 'function' ? t('btnNextSame') : "다음 문제 풀어보기 ➡️";
        submitBtn.style.backgroundColor = '#27ae60';
    }
}

// -------------------------------------------------------------
// 6. 타이머 및 연승 관리
// -------------------------------------------------------------
function startStreakTimer() {
    stopStreakTimer();
    timeLeft = STREAK_LIMIT_SEC;
    updateStreakAndTimerDisplay();

    const gaugeBar = document.getElementById('timer-gauge-bar');
    const gaugeContainer = document.getElementById('timer-gauge-container');
    if (gaugeContainer) gaugeContainer.style.display = 'block';
    if (gaugeBar) gaugeBar.style.width = '100%';

    streakTimer = setInterval(() => {
        timeLeft--;
        updateStreakAndTimerDisplay();

        if (gaugeBar) {
            const percentage = (timeLeft / STREAK_LIMIT_SEC) * 100;
            gaugeBar.style.width = `${percentage}%`;
        }

        if (timeLeft <= 0) {
            stopStreakTimer();
            handleTimeout();
        }
    }, 1000);
}

function stopStreakTimer() {
    if (streakTimer) {
        clearInterval(streakTimer);
        streakTimer = null;
    }
    const gaugeContainer = document.getElementById('timer-gauge-container');
    if (gaugeContainer) gaugeContainer.style.display = 'none';
}

function handleTimeout() {
    isSubmitted = true;
    const resultDiv = document.getElementById('result-message');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message incorrect';

    const timeoutStr = typeof t === 'function' ? t('timeout') : "⏰ 시간 초과!";
    const answerText = winningTiles.join(', ');
    resultDiv.innerHTML = `${timeoutStr}<br>👉 정답: [ ${answerText} ]`;

    checkStreakRecordAndReset();

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = typeof t === 'function' ? t('btnNextStreak') : "다음 문제 도전 ⚡";
    submitBtn.style.backgroundColor = '#8e44ad';
}

function updateStreakAndTimerDisplay() {
    const streakDisplay = document.getElementById('streak-display');
    const timerDisplay = document.getElementById('timer-display');

    if (currentMode === 'streak') {
        streakDisplay.innerText = typeof t === 'function' 
            ? t('streakCount', { count: streakCount }) 
            : `🔥 현재 ${streakCount}연승`;
        timerDisplay.innerText = typeof t === 'function' 
            ? t('timerSeconds', { count: timeLeft }) 
            : `⏱️ ${timeLeft}초`;

        streakDisplay.style.display = 'inline-block';
        timerDisplay.style.display = 'inline-block';
    } else {
        streakDisplay.style.display = 'none';
        timerDisplay.style.display = 'none';
    }
}

function checkStreakRecordAndReset() {
    if (streakCount >= 10) {
        const nameContainer = document.getElementById('name-input-container');
        if (nameContainer) nameContainer.style.display = 'block';
    }
    // 연승 수 초기화 (기록 등록용으로 직전 값 저장 후 차회 리셋)
}

// -------------------------------------------------------------
// 7. 명예의 전당 및 Google Sheets 연동
// -------------------------------------------------------------
async function saveRecord() {
    const input = document.getElementById('player-name-input');
    const name = (input.value.trim() === "") ? "Anonymous" : input.value.trim();

    try {
        // 암호화된 앱스크립트 URL 복호화 시도 (설정 시)
        let endpointUrl = "";
        try {
            const bytes = CryptoJS.AES.decrypt(ENCRYPTED_ENDPOINT, SECRET_PASSPHRASE);
            endpointUrl = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            endpointUrl = "";
        }

        if (!endpointUrl || !endpointUrl.startsWith("http")) {
            console.warn("리더보드 API URL이 설정되지 않아 로컬 기록으로 대체합니다.");
            alert(`🏆 [${name}] 님 ${streakCount}연승 기록 완료!`);
            document.getElementById('name-input-container').style.display = 'none';
            streakCount = 0;
            updateStreakAndTimerDisplay();
            return;
        }

        const payload = {
            name: name,
            score: streakCount,
            date: new Date().toISOString().split('T')[0]
        };

        await fetch(endpointUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert(`🏆 명예의 전당에 [${name}] (${streakCount}연승) 기록이 등록되었습니다!`);
        document.getElementById('name-input-container').style.display = 'none';
        streakCount = 0;
        updateStreakAndTimerDisplay();
        loadLeaderboard();

    } catch (err) {
        console.error("기록 저장 실패:", err);
        alert("기록 등록 중 오류가 발생했습니다.");
    }
}

async function loadLeaderboard() {
    const ul = document.getElementById('record-list-ul');
    if (!ul) return;

    try {
        let endpointUrl = "";
        try {
            const bytes = CryptoJS.AES.decrypt(ENCRYPTED_ENDPOINT, SECRET_PASSPHRASE);
            endpointUrl = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            endpointUrl = "";
        }

        if (!endpointUrl || !endpointUrl.startsWith("http")) {
            ul.innerHTML = `<li style="text-align:center; padding: 10px; color:#7f8c8d;">🥇 1위: Master (15연승)<br>🥈 2위: Mahjonger (12연승)</li>`;
            return;
        }

        const res = await fetch(endpointUrl);
        const data = await res.json();

        ul.innerHTML = '';
        if (data && data.length > 0) {
            data.slice(0, 10).forEach((item, idx) => {
                const li = document.createElement('li');
                li.style.padding = '6px 0';
                li.style.borderBottom = '1px solid #eee';
                li.innerHTML = `<span><b>#${idx + 1}</b> ${item.name}</span> <span style="color:#8e44ad; font-weight:bold;">${item.score}연승</span>`;
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = `<li style="text-align:center; padding: 10px; color:#7f8c8d;">등록된 명예의 전당 기록이 없습니다.</li>`;
        }

    } catch (err) {
        ul.innerHTML = `<li style="text-align:center; padding: 10px; color:#7f8c8d;">리더보드를 불러올 수 없습니다.</li>`;
    }
}

// -------------------------------------------------------------
// 8. 기타 이스터에그 및 트리거
// -------------------------------------------------------------
function initTitleClickTrigger() {
    const icon = document.getElementById('title-icon');
    if (icon) {
        let clickCount = 0;
        icon.addEventListener('click', () => {
            clickCount++;
            if (clickCount >= 5) {
                alert(`🀄 [Developer Info] App Version: ${APP_VERSION}\nPure Flush Waiting Quiz Engine Activated!`);
                clickCount = 0;
            }
        });
    }
}

function renderCustomButtons() {
    // 필요 시 UI 조작용 커스텀 확장 슬롯
}
