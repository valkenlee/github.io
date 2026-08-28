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

function validateHandDecomposition(handCounts, decomp, addedTile, waitType, targetMeldStart) {
    let needed = Array(10).fill(0);
    
    needed[decomp.pair] += 2;
    
    decomp.triplets.forEach(t => {
        needed[t] += 3;
    });

    decomp.sequences.forEach(s => {
        needed[s] += 1;
        needed[s+1] += 1;
        needed[s+2] += 1;
    });

    if (waitType === '단기' || waitType === '샤보' || waitType === '양면' || waitType === '간짱' || waitType === '변짱') {
        needed[addedTile] -= 1;
    }

    for (let i = 1; i <= 9; i++) {
        if (needed[i] > handCounts[i]) return false;
    }
    return true;
}

// 1. 양면 대기 헬퍼 함수
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

// 2. 샤보 대기 헬퍼 함수 (4장 사용 무효패 예외 처리 포함)
function getShanponExplanationItems(d, tile, validWaitsSet, origCounts) {
    let items = [];
    const p = d.pair;

    // d.pair와 d.triplets 내의 앙코들을 조합하여 샤보 구조 확인
    d.triplets.forEach(t => {
        // tile이 p(머리)이거나 t(앙코)에 해당하는 경우 모두 샤보 쌍 후보 생성
        if (t === tile || p === tile) {
            const shanponPair = [p, t].sort((a, b) => a - b);
            const st1 = shanponPair[0];
            const st2 = shanponPair[1];

            const st1Is4Count = origCounts[st1] === 4;
            const st2Is4Count = origCounts[st2] === 4;

            // 두 패 모두 원본 손패에 2장 이상 존재하면 샤보 구조로 인정
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

// 3. 단기, 간짱, 변짱 대기 헬퍼 함수
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
        // 유효 대기패 및 4장 소지 무효 대기패 모두 포함하여 탐색
        const allWaitCandidates = new Set([...validWaits]);
        for (let t = 1; t <= 9; t++) {
            if (origCounts[t] === 4) {
                allWaitCandidates.add(t);
            }
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

    // 중복 제거
    let uniqueMap = new Map();
    itemsList.forEach(item => {
        if (!uniqueMap.has(item.groupKey)) {
            uniqueMap.set(item.groupKey, item);
        }
    });

    let renderItems = Array.from(uniqueMap.values());

    // 1. 양면 -> 2. 샤보 -> 3. 단기 -> 4. 간짱 -> 5. 변짱 순서 정렬
    renderItems.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
        }
        return (a.tiles[0] || 0) - (b.tiles[0] || 0);
    });

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
        if (counts[num] < 4) {
            counts[num]++;
            hand.push(num);
        }
    }
    return hand.sort((a, b) => a - b);
}

function getWinningTiles(hand) {
    let waits = [];
    let maxedOut = [];
    let decomps = {};
    let isChiitoi = false;
    let isRyanpeikou = false;
    let counts = Array(10).fill(0);
    hand.forEach(num => counts[num]++);

    for (let tile = 1; tile <= 9; tile++) {
        if (counts[tile] < 4) {
            counts[tile]++;
            const checkRes = checkCompleteHand(counts, tile, hand);
            if (checkRes.complete) {
                waits.push(tile);
                decomps[tile] = checkRes.decompositions;
                if (checkRes.isRyanpeikou) isRyanpeikou = true;
                else if (checkRes.isChiitoi) isChiitoi = true;
            }
            counts[tile]--;
        } else {
            counts[tile]++;
            const checkRes = checkCompleteHand(counts, tile, hand);
            if (checkRes.complete) {
                maxedOut.push(tile);
                decomps[tile] = checkRes.decompositions;
                if (checkRes.isRyanpeikou) isRyanpeikou = true;
                else if (checkRes.isChiitoi) isChiitoi = true;
            }
            counts[tile]--;
        }
    }

    if (isRyanpeikou) {
        isChiitoi = false;
    }

    return { waits, maxedOut, decomps, isChiitoi, isRyanpeikou };
}

function checkCompleteHand(counts, addedTile, originalHand) {
    const decompositions = findAllDecompositions(counts, addedTile, originalHand);
    const isStandard = decompositions.length > 0;

    let pairCount = 0;
    let hasQuad = false;
    for (let i = 1; i <= 9; i++) {
        if (counts[i] === 2) pairCount++;
        if (counts[i] === 4) hasQuad = true;
    }
    const is7Pairs = (pairCount === 7 && !hasQuad);

    if (isStandard && is7Pairs) {
        if (checkRyanpeikouForm(counts)) {
            return { complete: true, decompositions, isChiitoi: false, isRyanpeikou: true };
        }
    }

    if (isStandard) {
        return { complete: true, decompositions, isChiitoi: false, isRyanpeikou: false };
    }

    if (is7Pairs) {
        return { complete: true, decompositions: [], isChiitoi: true, isRyanpeikou: false };
    }

    return { complete: false, decompositions: [], isChiitoi: false, isRyanpeikou: false };
}

function classifyWaitTypes(decomp, addedTile, originalHand) {
    let results = [];

    let origCounts = Array(10).fill(0);
    originalHand.forEach(n => origCounts[n]++);

    if (decomp.pair === addedTile) {
        results.push({ waitType: '단기', targetMeldStart: null });
    }

    if (decomp.triplets.includes(addedTile) && origCounts[addedTile] === 2) {
        results.push({ waitType: '샤보', targetMeldStart: null });
    }

    for (let s of decomp.sequences) {
        if (addedTile >= s && addedTile <= s + 2) {
            const pos = addedTile - s;

            if (pos === 1) {
                results.push({ waitType: '간짱', targetMeldStart: s });
            } else if ((s === 1 && addedTile === 3) || (s === 7 && addedTile === 7)) {
                results.push({ waitType: '변짱', targetMeldStart: s });
            } else if (pos === 0 || pos === 2) {
                const oppositeTile = (pos === 0) ? (s + 2) : (s - 1);
                
                if (oppositeTile >= 1 && oppositeTile <= 9) {
                    results.push({ waitType: '양면', targetMeldStart: s });
                }
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
                
                const decompCandidate = {
                    pair: pairVal,
                    triplets: trips,
                    sequences: seqs
                };

                const waitInfos = classifyWaitTypes(decompCandidate, addedTile, originalHand);

                waitInfos.forEach(waitInfo => {
                    results.push({
                        pair: pairVal,
                        triplets: trips,
                        sequences: seqs,
                        waitType: waitInfo.waitType,
                        targetMeldStart: waitInfo.targetMeldStart,
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
        let triplets = [];
        let sequences = [];
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
        counts[first]--;
        counts[first + 1]--;
        counts[first + 2]--;
        currentMelds.push({ type: 'sequence', val: first });
        findMeldsRecursive(counts, currentMelds, results);
        currentMelds.pop();
        counts[first]++;
        counts[first + 1]++;
        counts[first + 2]++;
    }
}

function checkRyanpeikouForm(counts) {
    let tempCounts = [...counts];
    for (let i = 1; i <= 9; i++) {
        if (tempCounts[i] >= 2) {
            tempCounts[i] -= 2;
            if (canFormTwoIdenticalChowPairs(tempCounts)) {
                return true;
            }
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
            tempCounts[i] -= 2;
            tempCounts[i+1] -= 2;
            tempCounts[i+2] -= 2;
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
    if (isSubmitted) {
        generateQuiz();
        return;
    }

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
            document.getElementById('streak-display').innerText = `🔥 현재 ${streakCount}연승 중`;
            resultDiv.innerHTML = `🎉 정답입니다! (${streakCount}연승 성공!)<br>👉 ${answerText}`;
        } else {
            resultDiv.innerHTML = `🎉 정답입니다!<br>👉 ${answerText}`;
        }
    } else {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `❌ 오답입니다.<br>👉 ${answerText}`;
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


// [기존 변수 선언 영역 아래 추가]
let titleClickCount = 0;
let customHand = []; // 히든 분석기용 손패 배열 (최대 13장)

window.addEventListener('DOMContentLoaded', async () => {
    loadLeaderboard();
    
    // 🀄 제목 5회 클릭 시 히든 모드 토글 이벤트 등록
    const titleElem = document.getElementById('main-title');
    if (titleElem) {
        titleElem.addEventListener('click', () => {
            titleClickCount++;
            if (titleClickCount === 5) {
                const hiddenArea = document.getElementById('hidden-analyzer');
                if (hiddenArea) {
                    const isHidden = hiddenArea.style.display === 'none';
                    hiddenArea.style.display = isHidden ? 'block' : 'none';
                    alert(isHidden ? '🔓 히든 패 분석기가 활성화되었습니다!' : '🔒 히든 패 분석기가 비활성화되었습니다.');
                    if (isHidden) renderCustomButtons();
                }
                titleClickCount = 0;
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT') return;
        if (e.key >= '1' && e.key <= '9') {
            if (isSubmitted) return; 
            const num = parseInt(e.key);
            const btn = document.getElementById(`btn-num-${num}`);
            if (btn) toggleSelect(num, btn);
        } else if (e.key === 'Enter') {
            if (document.getElementById('hidden-analyzer').style.display !== 'none' && customHand.length === 13) {
                analyzeCustomHand();
            } else {
                handleSubmitOrNext();
            }
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




/* ===================================================
 * 🔒 히든 계산기 / 패 분석기 관련 함수 (디버그 완결판)
 * =================================================== */

let titleClickCount = 0;
let customHand = [];

// 수패 무늬 랜덤 선택
function setRandomSuit() {
    const suits = ['Man', 'Pin', 'Sou'];
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const selectElem = document.getElementById('custom-suit-select');
    if (selectElem) {
        selectElem.value = randomSuit;
        updateCustomHandDisplay();
    }
}

// 제목(h1) 5회 클릭 이스터에그 토글
window.addEventListener('DOMContentLoaded', () => {
    const titleElem = document.getElementById('main-title');
    if (titleElem) {
        titleElem.addEventListener('click', () => {
            titleClickCount++;
            if (titleClickCount === 5) {
                const hiddenArea = document.getElementById('hidden-analyzer');
                if (hiddenArea) {
                    const isHidden = hiddenArea.style.display === 'none';
                    hiddenArea.style.display = isHidden ? 'block' : 'none';
                    if (isHidden) {
                        setRandomSuit();
                        renderCustomButtons();
                        alert('🔓 히든 패 분석기가 활성화되었습니다!');
                    }
                }
                titleClickCount = 0;
            }
        });
    }
});

// 1. 키보드 텍스트 직접 입력 (예: 1112345678999)
function applyCustomTextInput() {
    const inputElem = document.getElementById('custom-text-input');
    if (!inputElem) return;

    const rawVal = inputElem.value.trim();
    if (!/^[1-9]{13}$/.test(rawVal)) {
        alert('1~9 사이의 숫자 13자리를 정확히 입력해 주세요. (예: 1112345678999)');
        return;
    }

    const arr = rawVal.split('').map(Number);
    const counts = {};
    for (const num of arr) {
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] > 4) {
            alert(`숫자 ${num}이(가) 4장을 초과하여 입력되었습니다.`);
            return;
        }
    }

    customHand = arr.sort((a, b) => a - b);
    updateCustomHandDisplay();
    inputElem.value = '';
}

// 2. 패 선택 버튼(1~9) 렌더링
function renderCustomButtons() {
    const btnContainer = document.getElementById('custom-tile-buttons');
    if (!btnContainer) return;
    btnContainer.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-number';
        btn.innerText = `${i}`;
        btn.onclick = () => addTileToCustomHand(i);
        btnContainer.appendChild(btn);
    }
    updateCustomHandDisplay();
}

// 3. 패 클릭으로 추가
function addTileToCustomHand(num) {
    if (customHand.length >= 13) {
        alert('손패는 최대 13장까지만 입력할 수 있습니다.');
        return;
    }
    const count = customHand.filter(x => x === num).length;
    if (count >= 4) {
        alert(`${num}번 패는 이미 4장 선택되었습니다.`);
        return;
    }
    customHand.push(num);
    customHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

// 4. 입력된 손패 시각화
async function updateCustomHandDisplay() {
    const display = document.getElementById('custom-hand-container');
    const suitElem = document.getElementById('custom-suit-select');
    if (!display || !suitElem) return;

    const suitCode = suitElem.value;
    display.innerHTML = '';

    if (customHand.length === 0) {
        display.innerHTML = '<span style="color:#a3b18a; font-size:14px;">1~9 패 선택 버튼을 누르거나 숫자를 입력하세요.</span>';
        return;
    }

    for (let i = 0; i < customHand.length; i++) {
        const num = customHand[i];
        const img = document.createElement('img');
        img.className = 'tile-img';
        img.style.cursor = 'pointer';
        img.title = '클릭하면 이 패 삭제';
        
        try {
            img.src = await getTileImageSrc(suitCode, num);
        } catch (e) {
            img.alt = `${num}`;
        }
        
        img.onclick = () => removeTileFromCustomHand(i);
        display.appendChild(img);
    }
}

// 5. 개별 패 삭제 및 전체 초기화
function removeTileFromCustomHand(index) {
    customHand.splice(index, 1);
    updateCustomHandDisplay();
}

function clearCustomHand() {
    customHand = [];
    updateCustomHandDisplay();
    const resultDiv = document.getElementById('custom-result');
    if (resultDiv) resultDiv.style.display = 'none';
}

// 6. 대기패 분석 및 해설 계산 (디버그 완결)
function analyzeCustomHand() {
    if (customHand.length !== 13) {
        alert(`손패는 정확히 13장이어야 분석할 수 있습니다. (현재 ${customHand.length}장)`);
        return;
    }

    // 알고리즘 호출
    const res = getWinningTiles(customHand);
    const resultDiv = document.getElementById('custom-result');
    resultDiv.style.display = 'block';

    const waits = res.waits || [];
    if (waits.length === 0) {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `❌ 입력하신 손패는 <b>텐파이 상태(노텐)가 아닙니다.</b> (대기패 0개)`;
        return;
    }

    // 손패 내 4장 존재 시 화료 불가 처리
    const counts = {};
    customHand.forEach(num => counts[num] = (counts[num] || 0) + 1);
    const validWaits = waits.filter(w => (counts[w] || 0) < 4);
    const maxedOut = waits.filter(w => (counts[w] || 0) === 4);

    resultDiv.className = 'result-message correct';
    let html = `🎉 <b>분석 완료! Total ${validWaits.length}종류 대기패: [ ${validWaits.join(', ')} ]</b><br>`;

    if (maxedOut.length > 0) {
        html += `<span style="color:#e74c3c; font-size:14px;">(※ 손패에 이미 4장 소지하여 화료 불가한 패: ${maxedOut.join(', ')}번)</span><br>`;
    }

    // 기존 해설 생성 함수 연동 디버깅
    if (typeof generateExplanationHtml === 'function') {
        const problemObj = {
            hand: customHand,
            waits: validWaits,
            decompositions: res.decompositions || res.decomps || [],
            isChiitoi: res.isChiitoi,
            isRyanpeikou: res.isRyanpeikou
        };
        html += generateExplanationHtml(problemObj);
    }

    resultDiv.innerHTML = html;
}
