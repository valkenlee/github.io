let zipInstance = null;
const tileSvgCache = {};

const SUITS = [
    { code: 'Man', name: '만자패(萬)' },
    { code: 'Pin', name: '통자패(筒)' },
    { code: 'Sou', name: '삭자패(索)' }
];

let currentSuitObj = null;
let currentHand = [];
let winningTiles = [];
let maxedOutWinningTiles = []; // 4장 보유하여 실제로는 오를 수 없는 패 목록
let selectedTiles = new Set();

let currentMode = 'normal';
let isSubmitted = false;

let streakCount = 0;
let timerInterval = null;
let timeLeft = 60;
let pendingRecordStreak = 0;

window.addEventListener('DOMContentLoaded', async () => {
    loadLeaderboard();
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

async function getTileImageSrc(suitCode, num) {
    const targetName = `${suitCode}${num}.svg`;
    const cacheKey = `${suitCode}${num}`;
    
    if (tileSvgCache[cacheKey]) return tileSvgCache[cacheKey];

    let targetFile = null;
    zipInstance.forEach((relativePath, file) => {
        if (relativePath.endsWith(targetName)) {
            targetFile = file;
        }
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
    if (currentMode !== mode) {
        streakCount = 0;
    }
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

function generateQuiz() {
    clearInterval(timerInterval);
    isSubmitted = false;

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
    let resultData = { waits: [], maxedOut: [] };

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

    renderHand();
    renderButtons();
    
    document.getElementById('suit-name').innerText = `현재 무늬: [ ${currentSuitObj.name} ]`;
    
    const hintElem = document.getElementById('easy-hint');
    const streakElem = document.getElementById('streak-display');
    const timerElem = document.getElementById('timer-display');
    const streakInfoBox = document.getElementById('streak-info-box');

    if (currentMode === 'easy') {
        hintElem.innerText = `💡 힌트: 총 ${winningTiles.length}개의 오름패가 있습니다.`;
        hintElem.style.display = 'inline-block';
    } else {
        hintElem.style.display = 'none';
    }

    if (currentMode === 'streak') {
        streakElem.innerText = `🔥 현재 ${streakCount}연승 중`;
        streakElem.style.display = 'inline-block';
        timerElem.style.display = 'inline-block';
        streakInfoBox.style.display = 'block';
        startTimer();
    } else {
        streakElem.style.display = 'none';
        timerElem.style.display = 'none';
        streakInfoBox.style.display = 'none';
    }

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = '제출 및 정답 확인';
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
    document.getElementById('timer-display').innerText = `⏱️ ${timeLeft}초`;
}

function handleTimeout() {
    isSubmitted = true;
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message incorrect';

    let maxedInfo = maxedOutWinningTiles.length > 0 ? 
        `<br><small style="color:#666;">(※ ${maxedOutWinningTiles.join(', ')}번 패는 오름패 형태이지만 4장을 모두 가지고 있어 오를 수 없음)</small>` : '';

    resultDiv.innerHTML = `⏰ 시간 초과로 실패했습니다! 정답 오름패는 [ ${winningTiles.join(', ')} ] 입니다.${maxedInfo}`;

    checkStreakRecordAndReset();

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = '새 문제 제출';
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

// 오름패 계산 및 4장 모두 보유한 형태상 오름패(maxedOut) 구분
function getWinningTiles(hand) {
    let waits = [];
    let maxedOut = [];
    let counts = Array(10).fill(0);
    hand.forEach(num => counts[num]++);

    for (let tile = 1; tile <= 9; tile++) {
        if (counts[tile] < 4) {
            counts[tile]++;
            if (canFormHand(counts, 14)) {
                waits.push(tile);
            }
            counts[tile]--;
        } else {
            // 4장을 이미 가졌을 때, 가상으로 완성되는지 판별
            counts[tile]++;
            if (canFormHand(counts, 14)) {
                maxedOut.push(tile);
            }
            counts[tile]--;
        }
    }
    return { waits, maxedOut };
}

function canFormHand(counts, remaining) {
    if (remaining === 0) return true;

    let tempCounts = [...counts];

    if (remaining % 3 === 2) {
        for (let i = 1; i <= 9; i++) {
            if (tempCounts[i] >= 2) {
                tempCounts[i] -= 2;
                if (canFormHand(tempCounts, remaining - 2)) return true;
                tempCounts[i] += 2;
            }
        }
        return false;
    }

    let first = 0;
    for (let i = 1; i <= 9; i++) {
        if (tempCounts[i] > 0) { first = i; break; }
    }

    if (tempCounts[first] >= 3) {
        tempCounts[first] -= 3;
        if (canFormHand(tempCounts, remaining - 3)) return true;
        tempCounts[first] += 3;
    }

    if (first <= 7 && tempCounts[first + 1] > 0 && tempCounts[first + 2] > 0) {
        tempCounts[first]--;
        tempCounts[first + 1]--;
        tempCounts[first + 2]--;
        if (canFormHand(tempCounts, remaining - 3)) return true;
        tempCounts[first]++;
        tempCounts[first + 1]++;
        tempCounts[first + 2]++;
    }

    return false;
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
    if (isSubmitted) {
        generateQuiz();
        return;
    }

    if (selectedTiles.size === 0) return;

    clearInterval(timerInterval);

    // 정답 검증 시 maxedOutWinningTiles 패는 선택 여부에 영향을 주지 않도록 제외 및 비교
    const userAnswers = Array.from(selectedTiles).filter(tile => !maxedOutWinningTiles.includes(tile)).sort((a, b) => a - b);
    const isCorrect = userAnswers.length === winningTiles.length && 
                      userAnswers.every((val, idx) => val === winningTiles[idx]);

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';

    let maxedInfo = maxedOutWinningTiles.length > 0 ? 
        `<br><small style="font-size:13px; opacity:0.85;">(※ ${maxedOutWinningTiles.join(', ')}번 패는 오름패 형태이지만 4장을 모두 가지고 있어 오를 수 없음)</small>` : '';

    if (isCorrect) {
        resultDiv.className = 'result-message correct';
        if (currentMode === 'streak') {
            streakCount++;
            document.getElementById('streak-display').innerText = `🔥 현재 ${streakCount}연승 중`;
            resultDiv.innerHTML = `🎉 정답입니다! (${streakCount}연승 성공!) (오름패: ${winningTiles.join(', ')})${maxedInfo}`;
        } else {
            resultDiv.innerHTML = `🎉 정답입니다! (오름패: ${winningTiles.join(', ')})${maxedInfo}`;
        }
    } else {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `❌ 오답입니다. 정답 오름패는 [ ${winningTiles.join(', ')} ] 입니다.${maxedInfo}`;
        if (currentMode === 'streak') {
            checkStreakRecordAndReset();
        }
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

function saveRecord() {
    const inputElem = document.getElementById('player-name-input');
    const playerName = inputElem.value.trim() || '익명';
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const newRecord = {
        name: playerName.substring(0, 20),
        streak: pendingRecordStreak,
        date: dateStr
    };

    let records = JSON.parse(localStorage.getItem('mahjong_streak_records') || '[]');
    records.push(newRecord);
    records.sort((a, b) => b.streak - a.streak);
    records = records.slice(0, 10);

    localStorage.setItem('mahjong_streak_records', JSON.stringify(records));
    
    document.getElementById('name-input-container').style.display = 'none';
    inputElem.value = '';
    loadLeaderboard();
}

function loadLeaderboard() {
    const records = JSON.parse(localStorage.getItem('mahjong_streak_records') || '[]');
    const ul = document.getElementById('record-list-ul');
    ul.innerHTML = '';

    if (records.length === 0) {
        ul.innerHTML = '<li style="text-align:center; padding: 10px; color:#7f8c8d;">등록된 10연승 이상 기록이 없습니다. 도전에 성공해 보세요!</li>';
        return;
    }

    records.forEach((rec, idx) => {
        const li = document.createElement('li');
        li.className = 'record-item';
        li.innerHTML = `
            <span class="record-rank">${idx + 1}위</span>
            <span class="record-name">${escapeHtml(rec.name)}</span>
            <span class="record-score">${rec.streak}연승</span>
            <span class="record-date">${rec.date}</span>
        `;
        ul.appendChild(li);
    });
}

function resetLeaderboard() {
    const isConfirmed = confirm('정말로 저장된 모든 연승 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    if (isConfirmed) {
        localStorage.removeItem('mahjong_streak_records');
        loadLeaderboard();
        alert('연승 기록이 모두 삭제되었습니다.');
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
