/**
 * 청일색/수패 손패 분석 및 버림패 모드 연동 스크립트 (script_discard_mode.js)
 */

// 안전하게 수색(Suit) 코드('Man', 'Pin', 'Sou')를 가져오는 헬퍼 함수
function getSafeSuitCode() {
    if (typeof currentSuitObj !== 'undefined' && currentSuitObj && currentSuitObj.code) {
        return currentSuitObj.code;
    }
    if (typeof currentSuit !== 'undefined' && currentSuit) {
        return currentSuit;
    }
    return 'Man';
}

// 안전하게 수색 번호(1: Man, 2: Pin, 3: Sou)를 가져오는 헬퍼 함수
function getSafeSuitNum() {
    const code = getSafeSuitCode();
    if (code === 'Pin') return 2;
    if (code === 'Sou') return 3;
    return 1;
}

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
            let isYakuman = false;

            if (riichi === 1) {
                yakuList.push("리치(立直)");
                expectedHan += 1;
            }

            // script_yakuman.js 연동하여 역만 텐파이 검증
            let yakumanNames = [];
            if (typeof checkYakumanTenpai === "function") {
                const remainingHand13 = [];
                for (let i = 1; i <= 9; i++) {
                    for (let c = 0; c < hand14[i]; c++) {
                        remainingHand13.push(i);
                    }
                }
                const yakumanCheck = checkYakumanTenpai(suit, remainingHand13);
                if (yakumanCheck.isYakumanTenpai) {
                    isYakuman = true;
                    expectedHan = 13;
                    yakumanNames = yakumanCheck.possibleYakuman;
                    yakumanNames.forEach(yKey => {
                        const translated = typeof t === 'function' ? t(yKey) : yKey;
                        yakuList.unshift(translated);
                    });
                }
            }

            // 구련보등(9면 대기) 특수 체크
            if (waits.length === 9 && !isYakuman) {
                yakuList.unshift("순정 구련보등(九蓮寶燈)");
                expectedHan = 13;
                isYakuman = true;
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
                isYakuman: isYakuman,
                yakuList: yakuList,
                yakumanNames: yakumanNames
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


/**
 * 버림패 퀴즈 데이터를 생성하고 관련 상태를 업데이트합니다.
 */
function generateDiscardQuizData() {
    isSubmitted = false;

    if (typeof timer !== 'undefined' && timer) {
        clearInterval(timer);
        timer = null;
    }
    if (typeof timerId !== 'undefined' && timerId) {
        clearInterval(timerId);
        timerId = null;
    }

    let hand13 = [];
    let newCard = 1;
    let results = [];

    while (true) {
        hand13 = generateRandom13Tiles();
        newCard = Math.floor(Math.random() * 9) + 1;

        let counts = Array(10).fill(0);
        hand13.forEach(n => counts[n]++);
        if (counts[newCard] >= 4) continue;

        const suitNum = getSafeSuitNum();
        results = check_flush_tenpai(suitNum, hand13, newCard, 1, []);

        if (results.length > 0) break;
    }

    // 전역 상태 업데이트
    currentHand = hand13;
    discardNewCard = newCard;

    return true;
}

/**
 * 버림패 퀴즈 관련 UI를 업데이트 및 렌더링합니다.
 */
function renderDiscardQuizUI() {
    const hintElem = document.getElementById('easy-hint');
    const streakElem = document.getElementById('streak-display');
    const timerElem = document.getElementById('timer-display');
    const timerGaugeContainer = document.getElementById('timer-gauge-container');

    if (hintElem) hintElem.style.display = 'none';
    if (streakElem) streakElem.style.display = 'none';
    if (timerElem) timerElem.style.display = 'none';
    if (timerGaugeContainer) timerGaugeContainer.style.display = 'none';

    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }

    const quizArea = document.getElementById('quiz-area');
    if (quizArea) quizArea.style.display = 'block';

    renderHandWithDrawnCard();
    renderButtons();

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        submitBtn.innerText = typeof t === 'function' ? t('buttons.submit') : '제출 및 정답 확인';
        submitBtn.style.backgroundColor = '#2980b9';
    }
    selectedTiles.clear();
}

/**
 * 버림패 퀴즈를 생성하고 화면을 업데이트하는 메인 함수
 */
function generateDiscardQuiz() {
    generateDiscardQuizData();
    renderDiscardQuizUI();
}

// 쯔모패(14번째 패) 출력
async function renderHandWithDrawnCard() {
    const container = document.getElementById('hand-container');
    if (!container) return;
    container.innerHTML = '';

    const suitCode = getSafeSuitCode();

    for (const num of currentHand) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(suitCode, num);
        img.className = 'tile-img';
        img.alt = `${suitCode}${num}`;
        container.appendChild(img);
    }

    if (discardNewCard !== null) {
        const img = document.createElement('img');
        img.src = await getTileImageSrc(suitCode, discardNewCard);
        img.className = 'tile-img drawn-card';
        img.style.marginLeft = '12px';
        img.alt = `${suitCode}${discardNewCard}`;
        container.appendChild(img);
    }

    if (typeof updateHandDisplayLayout === 'function') {
        updateHandDisplayLayout();
    }
}

// 버림패 분석 상세 리포트 HTML 생성
function renderDiscardReportHTML(suitNum, hand13, newCard, userDiscard) {
    const tr = typeof t === 'function' ? t : (k) => k;
    const results = check_flush_tenpai(suitNum, hand13, newCard, 1, []);

    let maxWaitCount = -1;
    results.forEach(r => {
        if (r.totalWaitsCount > maxWaitCount) maxWaitCount = r.totalWaitsCount;
    });

    const maxWaitDiscardTiles = results
        .filter(r => r.totalWaitsCount === maxWaitCount)
        .map(r => r.discardTile);

    const yakumanDiscardTiles = results
        .filter(r => r.isYakuman)
        .map(r => r.discardTile);

    const userResult = results.find(r => r.discardTile === userDiscard);
    const isUserMaxWait = maxWaitDiscardTiles.includes(userDiscard);
    const isUserYakuman = userResult ? userResult.isYakuman : false;
    const hasAnyYakumanOption = yakumanDiscardTiles.length > 0;

    // 5가지 케이스 구분
    let caseType = 5;
    let isCorrect = false;

    if (isUserMaxWait && isUserYakuman) {
        caseType = 1;
        isCorrect = true;
    } else if (isUserMaxWait && !isUserYakuman) {
        caseType = !hasAnyYakumanOption ? 2 : 3;
        isCorrect = true;
    } else if (!isUserMaxWait && isUserYakuman) {
        caseType = 4;
        isCorrect = true;
    } else {
        caseType = 5;
        isCorrect = false;
    }

    let html = `<div class="explanation-box" style="margin-top:15px; text-align:left;">`;
    html += `<h4>📊 ${tr('discardReport.title', '버림패별 텐파이 및 역만 효율 분석 리포트')}</h4>`;
    html += `<ul style="list-style:none; padding:0; margin:0; font-size:14px; line-height:1.8;">`;

    for (let d = 1; d <= 9; d++) {
        const res = results.find(r => r.discardTile === d);
        let totalCount = hand13.filter(x => x === d).length + (newCard === d ? 1 : 0);
        if (totalCount === 0) continue;

        if (res) {
            const isBest = maxWaitDiscardTiles.includes(d);
            const isYak = res.isYakuman;
            const waitStr = res.waits.map(w => `${w.tile}(${tr('discardReport.tileCount', { count: w.remain })})`).join(', ');

            let yakumanNamesStr = "";
            if (isYak && res.yakumanNames && res.yakumanNames.length > 0) {
                const translatedNames = res.yakumanNames.map(yKey => tr(yKey));
                yakumanNamesStr = translatedNames.join(', ');
            } else if (isYak) {
                yakumanNamesStr = tr('bestReport.yakuman', '역만');
            }

            let badgeHtml = '';
            if (isBest) badgeHtml += ` <span style="color:#27ae60; font-weight:bold;">[${tr('discardReport.tagMaxWait', '최다 대기패')}]</span>`;
            if (isYak) badgeHtml += ` <span style="color:#8e44ad; font-weight:bold;">✨ [${tr('discardReport.tagYakumanTenpai', { yaku: yakumanNamesStr })}]</span>`;

            if (isBest || isYak) {
                const bg = isYak ? '#f4ecf7' : '#e8f8f5';
                const border = isYak ? '#8e44ad' : '#2ecc71';
                html += `<li class="report-item valid" style="font-weight:bold; color:#2c3e50; background-color:${bg}; padding:6px 10px; border-radius:4px; margin-bottom:4px; border:1px solid ${border};">`;
                html += `⭐ <b>[${d}] ${tr('discardReport.discard', '버림')}</b> ➔ ${tr('discardReport.waits', '대기패')}: [${waitStr}] (${tr('discardReport.totalCount', { count: res.totalWaitsCount })})${badgeHtml}`;
                
                if (!isBest && isYak) {
                    html += `<div style="font-size:12px; color:#7d3c98; margin-top:2px;">💡 ${tr('discardReport.tipYakumanOnly', { yaku: yakumanNamesStr })}</div>`;
                } else if (isBest && isYak) {
                    html += `<div style="font-size:12px; color:#1e8449; margin-top:2px;">💡 ${tr('discardReport.tipBestAndYakuman', { yaku: yakumanNamesStr })}</div>`;
                }
                
                html += `</li>`;
            } else {
                html += `<li class="report-item valid" style="color:#2980b9; background-color:#ebf5fb; padding:4px 8px; border-radius:4px; margin-bottom:4px; border-left:4px solid #3498db;">`;
                html += `⭕ <b>[${d}] ${tr('discardReport.discard', '버림')}</b> ➔ ${tr('discardReport.waits', '대기패')}: [${waitStr}] (${tr('discardReport.totalCount', { count: res.totalWaitsCount })})`;
                html += `</li>`;
            }
        } else {
            html += `<li class="report-item invalid" style="color:#a6acaf; background-color:#f4f6f7; padding:4px 8px; border-radius:4px; margin-bottom:4px;">`;
            html += `❌ <b>[${d}] ${tr('discardReport.discard', '버림')}</b> ➔ ${tr('discardReport.noten', '노텐 (텐파이 불가)')}`;
            html += `</li>`;
        }
    }

    html += `</ul></div>`;

    return { html, isCorrect, caseType, userResult, maxWaitDiscardTiles, yakumanDiscardTiles, maxWaitCount };
}

// 버림패 모드 제출 처리 함수
function handleDiscardModeSubmit() {
    const resultDiv = document.getElementById('result');
    const btnSubmit = document.getElementById('btn-submit');
    const tr = typeof t === 'function' ? t : (k, d) => d || k;

    if (!isSubmitted) {
        if (!selectedTiles || selectedTiles.size === 0) {
            if (resultDiv) {
                resultDiv.className = 'result-message incorrect';
                resultDiv.innerHTML = `⚠️ <b>${tr('alertSelectDiscardTile', '버릴 패를 하나 선택해 주세요.')}</b>`;
                resultDiv.style.display = 'block';
            }
            return;
        }

        isSubmitted = true;
        const userChoice = Array.from(selectedTiles)[0];
        const suitNum = getSafeSuitNum();

        const {
            html,
            isCorrect,
            caseType,
            userResult,
            maxWaitDiscardTiles,
            yakumanDiscardTiles,
            maxWaitCount
        } = renderDiscardReportHTML(suitNum, currentHand, discardNewCard, userChoice);

        recordAnswerResult(isCorrect);
        resultDiv.style.display = 'block';

        const userWaitCount = userResult ? userResult.totalWaitsCount : 0;

        if (caseType === 1) {
            resultDiv.className = 'result-message correct';
            resultDiv.style.borderColor = '#2ecc71';
            resultDiv.style.backgroundColor = '#e8f8f5';
            resultDiv.style.color = '#1e8449';
            resultDiv.innerHTML = `🎉 <b>${tr('discardResult.case1Title', '[정답] 완벽한 선택! (최다 대기 & 역만)')}</b><br>${tr('discardResult.case1Desc', { tile: userChoice, count: userWaitCount })}${html}`;
        } else if (caseType === 2) {
            resultDiv.className = 'result-message correct';
            resultDiv.style.borderColor = '#3498db';
            resultDiv.style.backgroundColor = '#ebf5fb';
            resultDiv.style.color = '#21618c';
            resultDiv.innerHTML = `⭕ <b>${tr('discardResult.case2Title', '[정답] 최적 대기패 선택!')}</b><br>${tr('discardResult.case2Desc', { tile: userChoice, count: userWaitCount })}${html}`;
        } else if (caseType === 3) {
            resultDiv.className = 'result-message correct';
            resultDiv.style.borderColor = '#2980b9';
            resultDiv.style.backgroundColor = '#eaf2f8';
            resultDiv.style.color = '#1b4f72';
            resultDiv.innerHTML = `⭕ <b>${tr('discardResult.case3Title', '[정답] 화료율 중심 선택! (역만 포기)')}</b><br>${tr('discardResult.case3Desc', { tile: userChoice, count: userWaitCount })}${html}`;
        } else if (caseType === 4) {
            resultDiv.className = 'result-message correct';
            resultDiv.style.borderColor = '#8e44ad';
            resultDiv.style.backgroundColor = '#f4ecf7';
            resultDiv.style.color = '#6c3483';
            resultDiv.innerHTML = `✨ <b>${tr('discardResult.case4Title', '[정답] 역만 노림수 인정!')}</b><br>${tr('discardResult.case4Desc', { tile: userChoice, count: userWaitCount })}${html}`;
        } else {
            resultDiv.className = 'result-message incorrect';
            resultDiv.style.borderColor = '#e74c3c';
            resultDiv.style.backgroundColor = '#fadbd8';
            resultDiv.style.color = '#78281f';

            let recommendation = `👉 ${tr('discardResult.recMaxWait', { tiles: maxWaitDiscardTiles.join(', '), count: maxWaitCount })}`;
            if (yakumanDiscardTiles.length > 0) {
                recommendation += `<br>👉 ${tr('discardResult.recYakuman', { tiles: yakumanDiscardTiles.join(', ') })}`;
            }

            resultDiv.innerHTML = `❌ <b>${tr('result.incorrect', '오답입니다.')}</b><br>${tr('discardResult.case5Desc', { tile: userChoice })}<br>${recommendation}${html}`;
        }

        if (btnSubmit) {
            btnSubmit.innerText = tr('buttons.nextSame', '같은 난이도로 새 문제 제출');
            btnSubmit.style.backgroundColor = '#27ae60';
        }
    } else {
        incrementPlayCount(currentMode);
        generateQuiz();
    }
}
