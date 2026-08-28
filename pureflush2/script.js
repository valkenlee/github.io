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
/* 패 분해 구조 및 대기 형태 해설 렌더링 */
function renderDecompositionExplanation() {
    if (currentMode === 'streak') return ''; 

    let html = `<div class="explanation-box">`;
    html += `<h4>🔍 대기패별 대기 유형 및 손패 구조 해설</h4>`;

    const allWaits = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
    let itemsList = [];

    allWaits.forEach(tile => {
        const decomps = winningDecompositions[tile] || [];
        if (decomps.length === 0) {
            if (isChiitoiHand) {
                itemsList.push({
                    tile: tile,
                    waitType: '단기',
                    groupKey: `chiitoi_${tile}`,
                    htmlContent: `${getWaitTypeBadgeHtml('단기')} <b>[ ${tile} ]</b> └ 치이토이츠(7쌍) 완성 형태 → <b style="color:#d35400;">[${tile}, <span class="filled-slot">(${tile})</span>]</b>`
                });
            }
        } else {
            decomps.forEach(d => {
                let parts = [];
                let groupKey = '';

                if (d.waitType === '양면') {
                    // 양면대기: (s-1)과 (s+3) 패가 대기패가 됨 -> [ (s-1), s, s+1, (s+3) ] 형태로 묶음
                    const wait1 = d.targetMeldStart - 1;
                    const wait2 = d.targetMeldStart + 2;
                    const meldStr = `<span class="filled-slot">(${wait1})</span>, <span style="color:#2980b9; font-weight:bold;">${d.targetMeldStart}, ${d.targetMeldStart+1}</span>, <span class="filled-slot">(${wait2})</span>`;
                    
                    parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
                    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));
                    d.sequences.forEach(s => {
                        if (s === d.targetMeldStart) {
                            parts.push(`[${meldStr}]`);
                        } else {
                            parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`);
                        }
                    });

                    // 대기패(1,4)와 상관없이 동일 슌츠 시작지점(targetMeldStart) 기준 그룹화
                    groupKey = `ryanmen_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}_m${d.targetMeldStart}`;

                } else if (d.waitType === '샤보') {
                    // 샤보대기: 손패의 또 다른 또이츠(머리 candidate)와 짝을 이루어 [2,2,(2)] [4,4,(4)] 형태 표현
                    parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
                    d.triplets.forEach(t => {
                        parts.push(`<span style="color:#27ae60; font-weight:bold;">[${t}, ${t}, <span class="filled-slot">(${t})</span>]</span>`);
                    });
                    d.sequences.forEach(s => parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`));

                    // 샤보 대기는 동일 머리(pair) 및 커츠(triplets) 구조를 공유하므로 묶어 처리
                    groupKey = `shanpon_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}`;

                } else {
                    // 단기, 간짱, 변짱 대기 처리
                    if (d.waitType === '단기') {
                        parts.push(`<span style="color:#d35400; font-weight:bold;">[${tile}, <span class="filled-slot">(${tile})</span>]</span>`);
                    } else {
                        parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
                    }

                    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));

                    let targetMeldHandled = false;
                    d.sequences.forEach(s => {
                        if (!targetMeldHandled && d.targetMeldStart === s && (d.waitType === '간짱' || d.waitType === '변짱')) {
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

                    groupKey = `${d.waitType}_tile${tile}_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}_m${d.targetMeldStart}`;
                }

                itemsList.push({
                    tile: tile,
                    waitType: d.waitType,
                    groupKey: groupKey,
                    partsStr: parts.join(' ')
                });
            });
        }
    });

    let groupMap = new Map();

    itemsList.forEach(item => {
        if (!groupMap.has(item.groupKey)) {
            groupMap.set(item.groupKey, {
                waitType: item.waitType,
                tiles: [item.tile],
                partsStr: item.partsStr,
                htmlContent: item.htmlContent || ''
            });
        } else {
            let existing = groupMap.get(item.groupKey);
            if (!existing.tiles.includes(item.tile)) {
                existing.tiles.push(item.tile);
            }
        }
    });

    groupMap.forEach(group => {
        group.tiles.sort((a, b) => a - b);
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

/* 대기 유형(단기, 샤보, 간짱, 변짱, 양면) 정밀 판별 함수 - 중복 및 다중 대기 유형 모두 수집 */
function classifyWaitTypes(decomp, addedTile, originalHand) {
    let results = [];

    let origCounts = Array(10).fill(0);
    originalHand.forEach(n => origCounts[n]++);

    // 1. 단기대기: 완성 패가 머리(작두)가 되는 경우
    if (decomp.pair === addedTile) {
        results.push({ waitType: '단기', targetMeldStart: null });
    }

    // 2. 샤보대기: 원본 손패(originalHand)에 완성 패가 2장 이상 존재하고, 해당 분해에서 커츠(triplets)를 형성하는 경우
    if (decomp.triplets.includes(addedTile) && origCounts[addedTile] >= 2) {
        results.push({ waitType: '샤보', targetMeldStart: null });
    }

    // 3. 슌츠 완성 대기 (간짱, 변짱, 양면)
    for (let s of decomp.sequences) {
        if (addedTile >= s && addedTile <= s + 2) {
            const pos = addedTile - s;

            if (pos === 1) {
                results.push({ waitType: '간짱', targetMeldStart: s });
            } else if ((s === 1 && addedTile === 3) || (s === 7 && addedTile === 7)) {
                results.push({ waitType: '변짱', targetMeldStart: s });
            } else if (pos === 0 || pos === 2) {
                results.push({ waitType: '양면', targetMeldStart: s });
            }
        }
    }

    return results;
}

/* 대기 분석 시 완성 패가 속한 정확한 멘츠를 추적하는 분해 알고리즘 */
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
    const isConfirmed = confirm('정말로 저장된 모든 연승 기록을 삭제하시겠습니까?\\n이 작업은 되돌릴 수 없습니다.');
    if (isConfirmed) {
        localStorage.removeItem('mahjong_streak_records');
        loadLeaderboard();
        alert('연승 기록이 모두 삭제되었습니다.');
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
