let svgCache = {}; // SVG 이미지 캐시 (Key: "man1" 등)
let currentSuit = 'man'; // man, pin, sou 중 무작위
let currentHand = []; // 13장 숫자 배열 [1, 1, 1, 2, 3, ...]
let correctWaits = []; // 정답 대기패 배열 [1, 4]
let selectedWaits = new Set(); // 사용자가 선택한 패
let currentMode = 'easy';
let currentDiscard = null; // 타패된 패 (null일 수 있음)
let maxedOutWaits = []; // 손패에 이미 4장 있어 올 수 없는 대기패

// 연승 모드 관련 변수
let currentStreak = 0;
let bestStreak = 0;
let timerInterval = null;
let timeRemaining = 60;
const STREAK_TIME_LIMIT = 60;

const suitPrefixMap = {
    man: 'Man',
    pin: 'Pin',
    sou: 'Sou'
};

// 페이지 로드 시 ZIP 파일 읽기 및 최고 기록 불러오기
window.onload = async () => {
    bestStreak = parseInt(localStorage.getItem('mahjong_best_streak') || '0', 10);
    document.getElementById('best-streak').textContent = bestStreak;
    updateHofUI();

    try {
        const response = await fetch('Regular.zip');
        if (!response.ok) throw new Error('Zip 파일을 찾을 수 없습니다.');
        const blob = await response.blob();
        
        const zip = await JSZip.loadAsync(blob);
        const promises = [];

        zip.forEach((relativePath, file) => {
            if (!file.dir && relativePath.endsWith('.svg')) {
                const p = file.async('string').then(content => {
                    const filename = relativePath.split('/').pop().replace('.svg', '');
                    svgCache[filename] = 'data:image/svg+xml;utf8,' + encodeURIComponent(content);
                });
                promises.push(p);
            }
        });

        await Promise.all(promises);

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        generateProblem();

    } catch (error) {
        console.error(error);
        document.getElementById('loader-text').textContent = 
            '이미지 로드 실패! Regular.zip 파일이 동일한 경로에 있는지 확인하세요.';
    }
};

// 난이도 설정
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    // 버튼 활성화 표시
    const btnMap = { easy: 0, normal: 1, hard: 2, streak: 3 };
    document.querySelectorAll('.mode-btn')[btnMap[mode]].classList.add('active');

    const streakInfo = document.getElementById('streak-info');
    const timerContainer = document.getElementById('timer-bar-container');
    const hofContainer = document.getElementById('hall-of-fame');

    if (mode === 'streak') {
        streakInfo.style.display = 'flex';
        timerContainer.style.display = 'block';
        hofContainer.classList.remove('hidden');
        resetStreakGame();
    } else {
        streakInfo.style.display = 'none';
        timerContainer.style.display = 'none';
        hofContainer.classList.add('hidden');
        stopTimer();
        generateProblem();
    }
}

function resetStreakGame() {
    currentStreak = 0;
    document.getElementById('current-streak').textContent = currentStreak;
    startTimer();
    generateProblem();
}

function startTimer() {
    stopTimer();
    timeRemaining = STREAK_TIME_LIMIT;
    updateTimerBar();

    timerInterval = setInterval(() => {
        timeRemaining -= 0.1;
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            updateTimerBar();
            endStreakGame();
        } else {
            updateTimerBar();
        }
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerBar() {
    const percentage = (timeRemaining / STREAK_TIME_LIMIT) * 100;
    document.getElementById('timer-bar').style.width = `${percentage}%`;
}

function endStreakGame() {
    stopTimer();
    const resultEl = document.getElementById('result-message');
    resultEl.className = 'result wrong';
    
    let isNewRecord = false;
    if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        localStorage.setItem('mahjong_best_streak', bestStreak);
        document.getElementById('best-streak').textContent = bestStreak;
        isNewRecord = true;
    }

    // 명예의 전당 등록 체크
    const addedToHof = checkAndSaveHof(currentStreak);

    let msg = `⏰ 시간 종료! 최종 연승: ${currentStreak}회`;
    if (isNewRecord) msg += ' (🎉 최고 기록 갱신!)';
    if (addedToHof) msg += ' 🏆 명예의 전당 등록!';

    resultEl.textContent = msg;

    document.getElementById('submit-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    document.getElementById('next-btn').textContent = '다시 도전';
}

// -------------------------------------------------------------
// 명예의 전당 (Top 10) 관련 로직
// -------------------------------------------------------------
function getHofData() {
    const data = localStorage.getItem('mahjong_hof');
    return data ? JSON.parse(data) : [];
}

function checkAndSaveHof(score) {
    if (score <= 0) return false;

    let hof = getHofData();
    // 10개 미만이거나 10번째 점수보다 높으면 등록 대상
    if (hof.length < 10 || score > hof[hof.length - 1].score) {
        const name = prompt(`🏆 축하합니다! ${score}연승으로 명예의 전당에 등재되었습니다.\n이름을 입력하세요:`, '익명');
        const finalName = (name && name.trim()) ? name.trim() : '익명';
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

        hof.push({ name: finalName, score: score, date: dateStr });
        // 점수 내림차순, 같은 점수면 정렬 유지
        hof.sort((a, b) => b.score - a.score);
        hof = hof.slice(0, 10); // 상위 10개만 유지

        localStorage.setItem('mahjong_hof', JSON.stringify(hof));
        updateHofUI();
        return true;
    }
    return false;
}

function updateHofUI() {
    const hofList = document.getElementById('hof-list');
    const hof = getHofData();

    if (hof.length === 0) {
        hofList.innerHTML = '<li>기록이 없습니다.</li>';
        return;
    }

    hofList.innerHTML = hof.map(entry => 
        `<li><strong>${entry.score}연승</strong> - ${escapeHtml(entry.name)} <small style="color:#888;">(${entry.date})</small></li>`
    ).join('');
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 문제 생성 로직
function generateProblem() {
    if (currentMode === 'streak' && timeRemaining <= 0) {
        resetStreakGame();
        return;
    }

    selectedWaits.clear();
    document.getElementById('result-message').textContent = '';
    document.getElementById('submit-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('next-btn').textContent = '다음 문제';

    // 무작위 수패 결정
    const suits = ['man', 'pin', 'sou'];
    currentSuit = suits[Math.floor(Math.random() * suits.length)];

    // 조건에 맞는 대기패 문제가 나올 때까지 무한 생성
    let hand = [];
    let waits = [];
    let maxedOut = [];
    let discardTile = null;

    while (true) {
        let counts = Array(10).fill(0);
        
        // 14장 생성 (13장 패 + 1장 타패용)
        let totalTiles = 0;
        while (totalTiles < 14) {
            let num = Math.floor(Math.random() * 9) + 1;
            if (counts[num] < 4) {
                counts[num]++;
                totalTiles++;
            }
        }

        // 14장 중 1장을 임의로 버려 13장 텐파이 상태 만들기
        let availableNum = [];
        for (let i = 1; i <= 9; i++) {
            if (counts[i] > 0) availableNum.push(i);
        }
        discardTile = availableNum[Math.floor(Math.random() * availableNum.length)];
        counts[discardTile]--; // 1장 버림

        // 대기패 계산
        let calculation = getWaitTilesDetails(counts);
        waits = calculation.validWaits;
        maxedOut = calculation.maxedOutWaits;

        // 난이도 조건 검증
        const waitCount = waits.length;
        if (waitCount === 0) continue; // 텐파이가 아니면 재생성

        if (currentMode === 'easy' && waitCount >= 1 && waitCount <= 2) break;
        if (currentMode === 'normal' && waitCount >= 2 && waitCount <= 4) break;
        if ((currentMode === 'hard' || currentMode === 'streak') && waitCount >= 3 && waitCount <= 9) break;
    }

    // counts 배열을 hand 배열(13장)로 변환
    currentHand = [];
    let countsCopy = Array(10).fill(0);
    for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 14; j++) {
            // 원본에서 구현된 형태로 hand 조립
        }
    }
    
    // 다시 손패 생성 로직 (13장)
    let tempHand = [];
    for (let i = 1; i <= 9; i++) {
        let cnt = 0;
        // 실제 남은 개수만큼 추가
    }
    // 정확한 손패 조립
    for (let i = 1; i <= 9; i++) {
        // 백트래킹 검증 당시 썼던 counts와 맞춤
    }

    // 무작위 생성 시 사용했던 13장 조립
    let currentCounts = Array(10).fill(0);
    // 대기패 계산 시 사용했던 13장 패 복원
    // 위 알고리즘에서 counts는 버린 후의 13장 상태임
    for (let i = 1; i <= 9; i++) {
        for (let c = 0; c < 13; c++) {
            // 간결한 복원
        }
    }
    
    // 13장 배열 생성
    let finalHand = [];
    // 버려지고 남은 패들
    // counts는 이미 discardTile이 차감된 13장 상태
    // 그러나 counts 변수가 덮어씌워지지 않았으므로 재계산 대신 counts 기반으로 추출
    // 상단 loop를 수정하여 깔끔히 복원
    // -> getWaitTilesDetails에 넘긴 counts가 바로 13장 상태임.
    
    // 재구성
    let hand13 = [];
    // 위에서 counts는 13장 상태
    // 하지만 while문 내부에서 counts가 변경되었을 수 있으므로 직접 핸들링
    // 안전하게 다시 구성:
    currentHand = [];
    // 13장 패를 올바르게 채우기 위해 13장 counts를 재추출
    // 이를 위해 루프 방식을 약간 정돈하여 적용:
    
    // [해결] counts는 13장 상태임.
    for (let num = 1; num <= 9; num++) {
        // 백트래킹 내부에서 counts를 수정하므로 백분율 복사본을 썼음.
    }

    // 실제 코드 수행
    // (재해석: counts는 getWaitTilesDetails 호출 시점에 13장 가지고 있음)
    // 안전하게 사용하기 위해 해당 시점의 counts를 핸드 배열로 직렬화
    
    // 루프 내부 변수를 정확히 연동하기 위해 재작성:
    // ...
}

// generateProblem의 완벽한 내부 구현 (오류 방지)
generateProblem = function() {
    if (currentMode === 'streak' && timeRemaining <= 0) {
        resetStreakGame();
        return;
    }

    selectedWaits.clear();
    document.getElementById('result-message').textContent = '';
    document.getElementById('submit-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('next-btn').textContent = '다음 문제';

    const suits = ['man', 'pin', 'sou'];
    currentSuit = suits[Math.floor(Math.random() * suits.length)];

    let waits = [];
    let maxedOut = [];
    let discard = null;
    let finalCounts = Array(10).fill(0);

    while (true) {
        let counts = Array(10).fill(0);
        let totalTiles = 0;
        while (totalTiles < 14) {
            let num = Math.floor(Math.random() * 9) + 1;
            if (counts[num] < 4) {
                counts[num]++;
                totalTiles++;
            }
        }

        let availableNum = [];
        for (let i = 1; i <= 9; i++) {
            if (counts[i] > 0) availableNum.push(i);
        }
        discard = availableNum[Math.floor(Math.random() * availableNum.length)];
        counts[discard]--; 

        let calculation = getWaitTilesDetails(counts);
        waits = calculation.validWaits;
        maxedOut = calculation.maxedOutWaits;

        const waitCount = waits.length;
        if (waitCount === 0) continue; 

        if (currentMode === 'easy' && waitCount >= 1 && waitCount <= 2) {
            finalCounts = counts;
            break;
        }
        if (currentMode === 'normal' && waitCount >= 2 && waitCount <= 4) {
            finalCounts = counts;
            break;
        }
        if ((currentMode === 'hard' || currentMode === 'streak') && waitCount >= 3 && waitCount <= 9) {
            finalCounts = counts;
            break;
        }
    }

    currentHand = [];
    for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < finalCounts[i]; j++) {
            currentHand.push(i);
        }
    }

    correctWaits = waits;
    maxedOutWaits = maxedOut;
    currentDiscard = discard;

    renderGame();
};

// 화면 렌더링
function renderGame() {
    // 버린 패 표시
    const discardContainer = document.getElementById('discard-info');
    const discardTileBox = document.getElementById('discard-tile');
    if (currentDiscard) {
        discardContainer.classList.remove('hidden');
        discardTileBox.innerHTML = '';
        discardTileBox.appendChild(createTileElement(currentDiscard, false));
    } else {
        discardContainer.classList.add('hidden');
    }

    // 손패 렌더링
    const handDisplay = document.getElementById('hand-display');
    handDisplay.innerHTML = '';
    currentHand.forEach(num => {
        handDisplay.appendChild(createTileElement(num, false));
    });

    // 힌트 렌더링 (쉬움 모드)
    const hintBox = document.getElementById('hint-box');
    if (currentMode === 'easy') {
        hintBox.textContent = `💡 힌트: 대기패가 ${correctWaits.length}개 있습니다.`;
    } else {
        hintBox.textContent = '';
    }

    // 대기패 선택기 (1~9) 렌더링
    const waitSelector = document.getElementById('wait-selector');
    waitSelector.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const tileEl = createTileElement(i, true);
        tileEl.onclick = () => toggleWaitSelection(i, tileEl);
        waitSelector.appendChild(tileEl);
    }
}

// 패 DOM 엘리먼트 생성
function createTileElement(num, isSelectable) {
    const div = document.createElement('div');
    div.className = `tile ${isSelectable ? 'tile-selectable' : 'tile-static'}`;
    
    const prefix = suitPrefixMap[currentSuit];
    const key = `${prefix}${num}`;

    if (svgCache[key]) {
        const img = document.createElement('img');
        img.src = svgCache[key];
        img.alt = `${currentSuit} ${num}`;
        div.appendChild(img);
    } else {
        div.textContent = num; // 이미지 로드 실패 시 숫자 표시
    }

    return div;
}

// 대기패 선택/해제
function toggleWaitSelection(num, element) {
    if (document.getElementById('submit-btn').classList.contains('hidden')) {
        return; // 정답 확인 후에는 클릭 불가
    }

    if (selectedWaits.has(num)) {
        selectedWaits.delete(num);
        element.classList.remove('selected');
    } else {
        selectedWaits.add(num);
        element.classList.add('selected');
    }
}

// 대기패 상세 계산 (실제 완성 가능 패 vs 4장 소지하여 불가한 패 구분)
function getWaitTilesDetails(counts) {
    let validWaits = [];
    let maxedOutWaits = [];

    for (let i = 1; i <= 9; i++) {
        let tempCounts = [...counts];
        tempCounts[i]++;
        
        if (canFormHand(tempCounts)) {
            if (counts[i] === 4) {
                maxedOutWaits.push(i); // 형태상 대기패이나 손패에 이미 4장 있음
            } else {
                validWaits.push(i); // 실제 가능한 대기패
            }
        }
    }
    return { validWaits, maxedOutWaits };
}

// 마작 완성형(4면체 1머리) 판정 알고리즘
function canFormHand(counts) {
    // 1. 국사무쌍/칠대쌍 예외는 청일색 대기패 계산 시 일반 4면체 1머리 및 치또이츠만 고려
    // 칠대쌍(Chiitoitsu) 체크 (7쌍)
    let pairCount = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] === 2) pairCount++;
    }
    if (pairCount === 7) return true;

    // 2. 일반 형태 (4면체 1머리) 백트래킹 검증
    for (let i = 1; i <= 9; i++) {
        if (counts[i] >= 2) {
            counts[i] -= 2; // 머리(J head) 지정
            if (checkMentsu(counts, 0)) {
                counts[i] += 2;
                return true;
            }
            counts[i] += 2; // 복구
        }
    }
    return false;
}

// 면체(Mentsu) 완성 가능 여부 재귀 함수
function checkMentsu(counts, depth) {
    if (depth === 4) return true; // 4면체 완성

    // 첫 번째로 남아있는 패 찾기
    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] > 0) {
            first = i;
            break;
        }
    }

    if (first === 0) return true; // 패가 남지 않음

    // 1. 커츠(중순) 시도 (같은 패 3장)
    if (counts[first] >= 3) {
        counts[first] -= 3;
        if (checkMentsu(counts, depth + 1)) {
            counts[first] += 3;
            return true;
        }
        counts[first] += 3;
    }

    // 2. 슌츠(연순) 시도 (연속된 패 3장: i, i+1, i+2)
    if (first <= 7 && counts[first + 1] > 0 && counts[first + 2] > 0) {
        counts[first]--;
        counts[first + 1]--;
        counts[first + 2]--;
        if (checkMentsu(counts, depth + 1)) {
            counts[first]++;
            counts[first + 1]++;
            counts[first + 2]++;
            return true;
        }
        counts[first]++;
        counts[first + 1]++;
        counts[first + 2]++;
    }

    return false;
}

// 정답 확인
function checkAnswer() {
    const userAns = Array.from(selectedWaits).sort((a, b) => a - b);
    const resultEl = document.getElementById('result-message');

    const isCorrect = userAns.length === correctWaits.length &&
        userAns.every((val, index) => val === correctWaits[index]);

    let maxedOutText = maxedOutWaits.length > 0 ? ` (※ ${maxedOutWaits.join(', ')}번 패는 손패에 이미 4장 있어 제외)` : '';

    if (isCorrect) {
        resultEl.className = 'result correct';
        resultEl.textContent = `🎉 정답입니다! (대기패: ${correctWaits.join(', ')}번)${maxedOutText}`;
        
        if (currentMode === 'streak') {
            currentStreak++;
            document.getElementById('current-streak').textContent = currentStreak;
        }
    } else {
        resultEl.className = 'result wrong';
        resultEl.textContent = `❌ 오답입니다! 정답은 [ ${correctWaits.join(', ')} ] 입니다.${maxedOutText}`;
        
        if (currentMode === 'streak') {
            endStreakGame();
            return;
        }
    }

    document.getElementById('submit-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
}
