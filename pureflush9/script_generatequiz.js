/* =============================================================
   📌 generateQuiz 관련 모듈 (script_generatequiz.js)
   ============================================================= */

function changeSuit() {
    let availableSuits = SUITS;
    if (currentSuitObj) {
        availableSuits = SUITS.filter(suit => suit.code !== currentSuitObj.code);
    }
    currentSuitObj = availableSuits[Math.floor(Math.random() * availableSuits.length)];
}

/**
 * 패(hand)가 지정된 난이도(mode) 조건에 적합한지 판별합니다.
 * @param {string} mode - 난이도 ('easy', 'normal', 'hard')
 * @param {Array<number>} hand - 13장의 패 Array
 * @returns {boolean} 적합 여부
 */
function checkDifficulty(mode, hand) {
    const resultData = getWinningTiles(hand);
    const count = resultData.waits.length;

    if (mode === 'easy') {
        return count >= 1 && count <= 2;
    } else if (mode === 'normal') {
        return count >= 2 && count <= 4;
    } else if (mode === 'hard') {
        if (count >= 3 && count <= 9) return true;
        if (count === 2 && Math.random() < 0.05) return true;
        return false;
    }

    return false;
}

/**
 * 퀴즈 데이터를 계산하고 관련 전역 상태를 업데이트합니다.
 */
function generateQuizData() {
    clearInterval(timerInterval);
    isSubmitted = false;

    changeSuit();

    // discard 모드일 경우 처리
    if (currentMode === 'discard') {
        if (typeof generateDiscardQuiz === 'function') {
            generateDiscardQuiz();
        }
        return false; // discard 모드는 별도 처리되므로 이후 UI 렌더링 스킵용 플래그 반환
    }

    let targetDifficulty = currentMode;
    if (currentMode === 'streak') {
        targetDifficulty = Math.random() < 0.2 ? 'normal' : 'hard';
    } else if (currentMode === 'best') {
        const r = Math.random();
        targetDifficulty = r < 0.2 ? 'easy' : (r < 0.5 ? 'normal' : 'hard');
    }

    let hand = [];

    // 적합한 난이도의 패가 나올 때까지 반복
    while (true) {
        hand = generateRandom13Tiles();
        if (checkDifficulty(targetDifficulty, hand)) {
            break;
        }
    }

    // 최종 확정된 패의 결과 데이터 계산
    const resultData = getWinningTiles(hand);

    // 전역 상태 업데이트
    currentHand = hand;
    winningTiles = resultData.waits;
    maxedOutWinningTiles = resultData.maxedOut;
    winningDecompositions = resultData.decomps;
    isChiitoiHand = resultData.isChiitoi;
    isRyanpeikouHand = resultData.isRyanpeikou;

    return true;
}

/**
 * 현재 상태에 맞춰 화면(UI)을 업데이트 및 렌더링합니다.
 */
function renderQuizUI() {
    updateModeUI();

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

/**
 * 퀴즈를 생성하고 화면을 업데이트하는 메인 함수
 */
function generateQuiz() {
    const isGenerated = generateQuizData();
    if (isGenerated) {
        renderQuizUI();
    }
}

/**
 * 랜덤한 13장 패(1~9)를 생성합니다.
 * 0~35 범위의 36개 슬롯 중 13개를 무작위로 추출한 뒤,
 * (slot % 9) + 1 로 패 번호(1~9)를 산출합니다.
 */
function generateRandom13Tiles() {
    // 0부터 35까지의 슬롯 생성
    const slots = Array.from({ length: 36 }, (_, i) => i);
    
    // Fisher-Yates 셔플로 슬롯 섞기
    for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    // 앞의 13개 슬롯을 가져와 % 9 연산 후 1~9 범위의 패 값으로 변환
    const hand = slots.slice(0, 13).map(slot => (slot % 9) + 1);

    // 오름차순 정렬 후 반환
    return hand.sort((a, b) => a - b);
}

/**
 * 주어진 13장 패에 대해 오름패(대기패) 및 수패 형태 정보를 계산합니다.
 */
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

/**
 * 완성형(일반형, 치이토이, 이량페코) 여부를 검사합니다.
 */
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

/**
 * 분해 형태에 맞춰 대기 형태(단기, 샤보, 간짱, 변짱, 양면)를 분류합니다.
 */
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

/**
 * 14장 패에서 머리(머리/작)와 몸통(커츠/슌츠)으로 분해 가능한 모든 조합을 찾습니다.
 */
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

/**
 * 재귀적으로 몸통(커츠/슌츠) 조합을 계산합니다.
 */
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

/**
 * 이량페코(二盃口) 형태 가능 여부를 확인합니다.
 */
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
