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

const MODE_DESCRIPTIONS = {
    easy: `📌 <b>🌱 쉬움 모드:</b><br>• 1~2개의 오름패만 존재하는 쉬운 문제이며, 오름패가 몇개인지도 알려 줍니다.<br>• 제출 후 대기 유형(양면, 단기, 샤보, 간짱, 변짱) 및 세부 분해 해설을 제공합니다.`,
    normal: `📌 <b>🌿 보통 모드:</b><br>• 일반적으로 2개의 오름패인 문제 위주로 출제됩니다만, 3개 이상의 오름패인 경우도 있습니다.<br>• 제출 후 대기 유형(양면, 단기, 샤보, 간짱, 변짱)과 세부 분해 해설을 제공줍니다.`,
    hard: `📌 <b>🔥 어려움 모드:</b><br>• 기본적으로 여러 형태의 다면대기 문제입니다.<br>• 제출 후 다면대기가 만드는 다양한 대기 유형과 분해 형태를 모두 분석해 드립니다.`,
    streak: `📌 <b>⚡ 어려움 연승 모드 규칙:</b><br>• ⏱️ <b>60초 제한시간:</b> 문제당 60초 안에 정답을 맞혀야 합니다.<br>• ⚡ 숙련자를 위한 모드로 <b>별도의 패 분해 해설이 제공되지 않고</b> 빠른 진행을 지원합니다.`
};

window.addEventListener('DOMContentLoaded', async () => {
    loadLeaderboard();
    
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

function updateModeUI() {
    document.querySelectorAll('.btn-diff').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-mode-${currentMode}`);
    if (activeBtn) activeBtn.classList.add('active');

    const infoBox = document.getElementById('mode-info-box');
    infoBox.innerHTML = MODE_DESCRIPTIONS[currentMode] || '';
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
        hintElem.innerText = `💡 힌트: 총 ${winningTiles.length}개의 오름패가 있습니다.`;
        hintElem.style.display = 'inline-block';
    } else {
        hintElem.style.display = 'none';
    }

    if (currentMode === 'streak') {
        streakElem.innerText = `🔥 현재 ${streakCount}연승 중`;
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
    const percentage = Math.max(0, (timeLeft / 60) * 100);
    document.getElementById('timer-gauge-bar').style.width = `${percentage}%`;
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

/* 수정한 패 분해 구조 및 대기 형태 해설 렌더링 함수 */
function renderDecompositionExplanation() {
    if (currentMode === 'streak') return ''; 

    let html = `<div class="explanation-box">`;
    html += `<h4>🔍 대기패별 대기 유형 및 손패 구조 해설</h4>`;

    const allWaits = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
    let itemsList = [];

    // 치또이츠 처리
    if (isChiitoiHand) {
        allWaits.forEach(tile => {
            itemsList.push({
                waitType: '단기',
                sortOrder: 3, // 단기
                tiles: [tile],
                htmlContent: `${getWaitTypeBadgeHtml('단기')} <b>[ ${tile} ]</b> └ 치이토이츠(7쌍) 완성 형태 → <b style="color:#d35400;">[${tile}, <span class="filled-slot">(${tile})</span>]</b>`
            });
        });
    } else {
        allWaits.forEach(tile => {
            const decomps = winningDecompositions[tile] || [];
            decomps.forEach(d => {
                let parts = [];
                let groupKey = '';
                let waitType = d.waitType;

                if (waitType === '양면') {
                    const w1 = d.targetMeldStart - 1;
                    const w2 = d.targetMeldStart + 2;
                    
                    const w1Str = (w1 >= 1 && w1 <= 9) ? `(${w1})` : '';
                    const w2Str = (w2 >= 1 && w2 <= 9) ? `(${w2})` : '';

                    let meldParts = [];
                    if (w1Str) meldParts.push(w1Str);
                    meldParts.push(d.targetMeldStart);
                    meldParts.push(d.targetMeldStart + 1);
                    if (w2Str) meldParts.push(w2Str);

                    parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
                    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));
                    d.sequences.forEach(s => {
                        if (s === d.targetMeldStart) {
                            parts.push(`<span style="color:#2980b9; font-weight:bold;">[${meldParts.join(', ')}]</span>`);
                        } else {
                            parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`);
                        }
                    });

                    // 양면대기 고유 식별키
                    groupKey = `ryanmen_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}_m${d.targetMeldStart}`;

                    itemsList.push({
                        waitType: '양면',
                        sortOrder: 1,
                        groupKey: groupKey,
                        tiles: [w1, w2].filter(x => x >= 1 && x <= 9).sort((a,b)=>a-b),
                        partsStr: parts.join(' ')
                    });

                } else if (waitType === '샤보') {
                    // 샤보 대기는 머리(pair)와 triplet으로 지정된 두 패가 샤보 대상패가 됨
                    let shanponTiles = [d.pair];
                    if (d.triplets.length > 0) {
                        d.triplets.forEach(t => {
                            if (!shanponTiles.includes(t)) shanponTiles.push(t);
                        });
                    }
                    shanponTiles.sort((a, b) => a - b);

                    // 두 샤보 패에 대한 강조 포맷팅: [1, 1, (1)] [4, 4, (4)]
                    shanponTiles.forEach(st => {
                        parts.push(`<span style="color:#27ae60; font-weight:bold;">[${st}, ${st}, <span class="filled-slot">(${st})</span>]</span>`);
                    });

                    // 그 외 remaining triplets 및 sequences 처리
                    d.triplets.forEach(t => {
                        if (!shanponTiles.includes(t)) {
                            parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`);
                        }
                    });
                    d.sequences.forEach(s => parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`));

                    groupKey = `shanpon_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}`;

                    itemsList.push({
                        waitType: '샤보',
                        sortOrder: 2,
                        groupKey: groupKey,
                        tiles: shanponTiles,
                        partsStr: parts.join(' ')
                    });

                } else {
                    // 단기, 간짱, 변짱 대기 (단일 대기패)
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

                    let sortOrder = 3; // 단기
                    if (waitType === '간짱') sortOrder = 4;
                    if (waitType === '변짱') sortOrder = 5;

                    groupKey = `${waitType}_tile${tile}_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}_m${d.targetMeldStart}`;

                    itemsList.push({
                        waitType: waitType,
                        sortOrder: sortOrder,
                        groupKey: groupKey,
                        tiles: [tile],
                        partsStr: parts.join(' ')
                    });
                }
            });
        });
    }

    // 중복 제거
    let uniqueMap = new Map();
    itemsList.forEach(item => {
        if (!uniqueMap.has(item.groupKey)) {
            uniqueMap.set(item.groupKey, item);
        }
    });

    let renderItems = Array.from(uniqueMap.values());

    // 요청된 순서대로 정렬 (양면 -> 샤보 -> 단기 -> 간짱 -> 변짱)
    renderItems.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
        }
        return a.tiles[0] - b.tiles[0];
    });

    // HTML 생성
    renderItems.forEach(group => {
        const tileHeader = group.tiles.length > 1 ? `[ ${group.tiles.join(', ')} ]` : `[ ${group.tiles[0]} ]`;
        const badge = getWaitTypeBadgeHtml(group.waitType);

        if (group.htmlContent) {
            html += `<div class="explanation-item">${group.htmlContent}</div>`;
        } else {
            html += `<div class="explanation-item">${badge} <b>${tileHeader}</b> └ ${group.partsStr}</div>`;
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

function handleTimeout() {
    isSubmitted = true;
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-message incorrect';

    resultDiv.innerHTML = `⏰ 시간 초과로 실패했습니다!<br>👉 ${getAnswerString()}`;

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
        if (counts
