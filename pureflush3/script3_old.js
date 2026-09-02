/**
 * 청일색/수패 손패 분석 및 버림패 모드 연동 스크립트 (script3.js)
 */

// =================================================================
// 1. 핵심 버림패 텐파이 계산 로직
// =================================================================
function check_flush_tenpai(suit, hand, new_card, riichi = 1, discard = []) {
    const parseHand = (str) => {
        const counts = Array(10).fill(0);
        const arr = typeof str === 'string' ? str.split('').map(Number) : str;
        arr.forEach(n => counts[n]++);
        return counts;
    };

    const isComplete = (counts) => {
        const total = counts.reduce((a, b) => a + b, 0);
        if (total === 0) return true;

        for (let i = 1; i <= 9; i++) {
            if (counts[i] >= 2) {
                counts[i] -= 2;
                if (checkMentsu(counts)) {
                    counts[i] += 2;
                    return true;
                }
                counts[i] += 2;
            }
        }

        if (total === 14) {
            let pairs = 0;
            for (let i = 1; i <= 9; i++) if (counts[i] >= 2) pairs++;
            if (pairs === 7) return true;
        }
        return false;
    };

    const checkMentsu = (counts) => {
        let first = 0;
        for (let i = 1; i <= 9; i++) {
            if (counts[i] > 0) { first = i; break; }
        }
        if (first === 0) return true;

        if (counts[first] >= 3) {
            counts[first] -= 3;
            if (checkMentsu(counts)) {
                counts[first] += 3;
                return true;
            }
            counts[first] += 3;
        }

        if (first <= 7 && counts[first + 1] > 0 && counts[first + 2] > 0) {
            counts[first]--; counts[first + 1]--; counts[first + 2]--;
            if (checkMentsu(counts)) {
                counts[first]++; counts[first + 1]++; counts[first + 2]++;
                return true;
            }
            counts[first]++; counts[first + 1]++; counts[first + 2]++;
        }

        return false;
    };

    const getShanten = (counts) => {
        let minShanten = 8;

        const dfs = (depth, mentsu, tatsu, c) => {
            let i = 1;
            while (i <= 9 && c[i] === 0) i++;
            if (i > 9) {
                const current = 8 - (mentsu * 2) - tatsu;
                if (current < minShanten) minShanten = current;
                return;
            }

            if (c[i] >= 3) {
                c[i] -= 3; dfs(depth, mentsu + 1, tatsu, c); c[i] += 3;
            }
            if (i <= 7 && c[i + 1] > 0 && c[i + 2] > 0) {
                c[i]--; c[i + 1]--; c[i + 2]--;
                dfs(depth, mentsu + 1, tatsu, c);
                c[i]++; c[i + 1]++; c[i + 2]++;
            }
            if (c[i] >= 2) {
                c[i] -= 2; dfs(depth, mentsu, tatsu + 1, c); c[i] += 2;
            }
            if (i <= 8 && c[i + 1] > 0) {
                c[i]--; c[i + 1]--; dfs(depth, mentsu, tatsu + 1, c); c[i]++; c[i + 1]++;
            }
            if (i <= 7 && c[i + 2] > 0) {
                c[i]--; c[i + 2]--; dfs(depth, mentsu, tatsu + 1, c); c[i]++; c[i + 2]++;
            }
            c[i]--; dfs(depth, mentsu, tatsu, c); c[i]++;
        };

        for (let i = 1; i <= 9; i++) {
            if (counts[i] >= 2) {
                counts[i] -= 2;
                dfs(0, 0, 0, counts);
                counts[i] += 2;
            }
        }
        dfs(0, 0, 0, counts);

        let pairs = 0, types = 0;
        for (let i = 1; i <= 9; i++) {
            if (counts[i] >= 1) types++;
            if (counts[i] >= 2) pairs++;
        }
        let chiitoiShanten = 6 - pairs + Math.max(0, 7 - types);

        return Math.min(minShanten, chiitoiShanten);
    };

    const getWaits = (counts13) => {
        const waits = [];
        for (let p = 1; p <= 9; p++) {
            if (counts13[p] < 4) {
                counts13[p]++;
                if (isComplete(counts13)) {
                    waits.push(p);
                }
                counts13[p]--;
            }
        }
        return waits;
    };

    const handCounts = parseHand(hand);
    const initialShanten = getShanten(handCounts);

    if (initialShanten > 1) {
        return [];
    }

    const hand14 = [...handCounts];
    hand14[new_card]++;

    const results = [];
    const visitedDiscards = new Set();

    for (let d = 1; d <= 9; d++) {
        if (hand14[d] === 0 || visitedDiscards.has(d)) continue;
        visitedDiscards.add(d);

        hand14[d]--;
        const waits = getWaits(hand14);

        if (waits.length > 0) {
            let totalWaitsCount = 0;
            const waitDetails = waits.map(w => {
                const countInHand = hand14[w];
                const remain = 4 - countInHand;
                totalWaitsCount += remain;
                return { tile: w, remain };
            });

            const isFuriten = waits.some(w => discard.includes(w));
            const yakuList = ["청일색(清一色)"];
            let expectedHan = 6;

            if (riichi === 1) {
                yakuList.push("리치(立直)");
                expectedHan += 1;
            }

            if (waits.length === 9) {
                yakuList.unshift("순정 구련보등(九蓮寶燈)");
                expectedHan = 13;
            }

            let pekoCount = 0;
            for (let i = 1; i <= 7; i++) {
                if (hand14[i] >= 2 && hand14[i + 1] >= 2 && hand14[i + 2] >= 2) pekoCount++;
            }
            if (pekoCount >= 1) {
                yakuList.push("이페코(一盃口)");
                expectedHan += 1;
            }

            if (hand14[1] && hand14[2] && hand14[3] && hand14[4] && hand14[5] && hand14[6] && hand14[7] && hand14[8] && hand14[9]) {
                yakuList.push("일기통관(一氣通貫)");
                expectedHan += 2;
            }

            if (waits.length >= 2) {
                yakuList.push("핑후(平和) 가능성");
            }

            results.push({
                discardTile: d,
                waits: waitDetails,
                totalWaitsCount: totalWaitsCount,
                isFuriten: isFuriten,
                expectedHan: expectedHan,
                yakuList: yakuList
            });
        }

        hand14[d]++;
    }

    return results;
}

// =================================================================
// 2. UI 연동 및 버림패 퀴즈 모드 로직
// =================================================================
let discardNewCard = null;

// 버림패 퀴즈 문제 생성 (13장 패 + 새로 뽑은 1장 = 총 14장 생성)
function generateDiscardQuiz() {
    let hand13 = [];
    let newCard = 1;
    let results = [];

    while (true) {
        hand13 = generateRandom13Tiles();
        newCard = Math.floor(Math.random() * 9) + 1;

        // 새로 가져온 패 포함 동일 패가 5장 이상이 되지 않도록 검증
        let counts = Array(10).fill(0);
        hand13.forEach(n => counts[n]++);
        if (counts[newCard] >= 4) continue;

        const suitNum = currentSuitObj ? (currentSuitObj.code === 'Man' ? 1 : (currentSuitObj.code === 'Pin' ? 2 : 3)) : 1;
        results = check_flush_tenpai(suitNum, hand13, newCard, 1, []);

        // 버려서 텐파이가 되는 버림패 후보가 적어도 1개 이상일 때 확정
        if (results.length > 0) break;
    }

    currentHand = hand13;
    discardNewCard = newCard;

    // 14장 쯔모패 포함 손패 표시
    renderHandWithDrawnCard();
    renderButtons();
}

// 쯔모패(14번째 패)를 시각적으로 구분하여 출력
async function renderHandWithDrawnCard() {
    const container = document.getElementById('hand-container');
    if (!container) return;
    container.innerHTML = '';

    // 기존 13장패 Render
    for (const num of currentHand) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(currentSuitObj.code, num);
        img.className = 'tile-img';
        img.alt = `${currentSuitObj.code}${num}`;
        container.appendChild(img);
    }

    // 새로 가져온 14번째 패 (여백을 주어 쯔모 상태 표현)
    if (discardNewCard !== null) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(currentSuitObj.code, discardNewCard);
        img.className = 'tile-img drawn-card';
        img.style.marginLeft = '12px';
        img.alt = `${currentSuitObj.code}${discardNewCard}`;
        container.appendChild(img);
    }
}

// 버림패 분석 상세 리포트 HTML 생성
function renderDiscardReportHTML(suitNum, hand13, newCard, userDiscard) {
    const results = check_flush_tenpai(suitNum, hand13, newCard, 1, []);
    const tr = typeof t === 'function' ? t : (k) => k;

    // 최대 오름패 매수를 가진 최적의 버림패(Best Discards) 찾기
    let maxWaitCount = -1;
    results.forEach(r => {
        if (r.totalWaitsCount > maxWaitCount) maxWaitCount = r.totalWaitsCount;
    });

    const bestDiscardTiles = results
        .filter(r => r.totalWaitsCount === maxWaitCount)
        .map(r => r.discardTile);

    const isUserBest = bestDiscardTiles.includes(userDiscard);

    let html = `<div class="explanation-box" style="margin-top:15px; text-align:left;">`;
    html += `<h4>📊 버림패별 텐파이 효율 분석 리포트</h4>`;
    html += `<ul style="list-style:none; padding:0; margin:0; font-size:14px; line-height:1.8;">`;

    for (let d = 1; d <= 9; d++) {
        const res = results.find(r => r.discardTile === d);
        
        // 손패(13장 + 쯔모패)에 1장이라도 존재하는 경우만 버림 후보 출력
        let totalCount = hand13.filter(x => x === d).length + (newCard === d ? 1 : 0);
        if (totalCount === 0) continue;

        if (res) {
            const isBest = bestDiscardTiles.includes(d);
            const waitStr = res.waits.map(w => `${w.tile}(${w.remain}장)`).join(', ');

            if (isBest) {
                html += `<li class="report-item best" style="font-weight:bold; color:#1e8449; background-color:#e8f8f5; padding:6px 10px; border-radius:4px; margin-bottom:4px; border:1px solid #2ecc71;">`;
                html += `🏆 <b>[${d}] 버림</b> ➔ 대기패: [${waitStr}] (총 <b>${res.totalWaitsCount}장</b>) <b>[최적의 버림패]</b>`;
                html += `</li>`;
            } else {
                html += `<li class="report-item valid" style="font-weight:bold; color:#2980b9; background-color:#ebf5fb; padding:4px 8px; border-radius:4px; margin-bottom:4px; border-left:4px solid #3498db;">`;
                html += `⭕ <b>[${d}] 버림</b> ➔ 대기패: [${waitStr}] (총 <b>${res.totalWaitsCount}장</b>)`;
                html += `</li>`;
            }
        } else {
            html += `<li class="report-item invalid" style="color:#a6acaf; background-color:#f4f6f7; padding:4px 8px; border-radius:4px; margin-bottom:4px;">`;
            html += `❌ <b>[${d}] 버림</b> ➔ 노텐 (텐파이 불가)`;
            html += `</li>`;
        }
    }

    html += `</ul></div>`;
    return { html, isUserBest, bestDiscardTiles, maxWaitCount };
}

// 제출 처리 함수
function handleDiscardModeSubmit() {
    const resultDiv = document.getElementById('result');
    const btnSubmit = document.getElementById('btn-submit');
    const tr = typeof t === 'function' ? t : (k, d) => d || k;

    if (!isSubmitted) {
        if (!selectedTiles || selectedTiles.size === 0) {
            if (resultDiv) {
                resultDiv.className = 'result-message incorrect';
                resultDiv.innerHTML = `⚠️ <b>버릴 패를 선택해 주세요.</b>`;
                resultDiv.style.display = 'block';
            }
            return;
        }

        isSubmitted = true;
        const userChoice = Array.from(selectedTiles)[0];
        const suitNum = currentSuitObj.code === 'Man' ? 1 : (currentSuitObj.code === 'Pin' ? 2 : 3);

        const { html, isUserBest, bestDiscardTiles, maxWaitCount } = renderDiscardReportHTML(
            suitNum,
            currentHand,
            discardNewCard,
            userChoice
        );

        resultDiv.style.display = 'block';

        if (isUserBest) {
            resultDiv.className = 'result-message correct';
            resultDiv.innerHTML = `🎉 <b>정답입니다!</b><br>선택하신 [<b>${userChoice}</b>]번 패는 대기패가 가장 많은(총 <b>${maxWaitCount}장</b>) 최선의 버림패입니다.${html}`;
        } else {
            resultDiv.className = 'result-message incorrect';
            resultDiv.innerHTML = `❌ <b>오답입니다.</b><br>선택하신 [<b>${userChoice}</b>]번 패는 최선의 선택이 아닙니다.<br>👉 최적의 버림패: <b>[ ${bestDiscardTiles.join(', ')} ]</b> (${maxWaitCount}장 대기)${html}`;
        }

        if (btnSubmit) btnSubmit.innerText = tr('btnNextSame', '다음 문제');
    } else {
        isSubmitted = false;
        if (resultDiv) resultDiv.style.display = 'none';
        if (btnSubmit) btnSubmit.innerText = tr('btnSubmit', '제출');
        if (typeof generateQuiz === 'function') generateQuiz();
    }
}

// 기존 함수 Hooking 및 이벤트 초기화
(function initDiscardHooks() {
    // 1. Submit 연동 Hook
    const rawSubmit = window.handleSubmitOrNext;
    window.handleSubmitOrNext = function() {
        if (typeof currentMode !== 'undefined' && currentMode === 'discard') {
            handleDiscardModeSubmit();
        } else if (typeof rawSubmit === 'function') {
            rawSubmit.apply(this, arguments);
        }
    };

    // 2. Quiz 생성 Hook
    const rawGenerateQuiz = window.generateQuiz;
    window.generateQuiz = function() {
        if (typeof currentMode !== 'undefined' && currentMode === 'discard') {
            if (typeof updateModeUI === 'function') updateModeUI();
            generateDiscardQuiz();
            if (typeof selectedTiles !== 'undefined' && selectedTiles.clear) {
                selectedTiles.clear();
            }
        } else if (typeof rawGenerateQuiz === 'function') {
            rawGenerateQuiz.apply(this, arguments);
        }
    };
})();