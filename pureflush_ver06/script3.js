/**
 * 청일색/수패 손패 분석 및 버림패 모드 연동 스크립트 (script3.js)
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

// 버림패 퀴즈 문제 생성
function generateDiscardQuiz() {

    // 1. 실행 중인 streak 타이머 정지 (타이머 변수명에 맞게 확인)
    if (typeof timer !== 'undefined' && timer) {
        clearInterval(timer);
        timer = null;
    }
    if (typeof timerId !== 'undefined' && timerId) {
        clearInterval(timerId);
        timerId = null;
    }

    // 2. 다른 모드 전용 UI 요소 숨김 처리
    const hintElem = document.getElementById('easy-hint');
    const streakElem = document.getElementById('streak-display');
    const timerElem = document.getElementById('timer-display');
    const timerGaugeContainer = document.getElementById('timer-gauge-container');

    if (hintElem) hintElem.style.display = 'none';
    if (streakElem) streakElem.style.display = 'none';
    if (timerElem) timerElem.style.display = 'none';
    if (timerGaugeContainer) timerGaugeContainer.style.display = 'none';

    // 3. 이전 결과창 및 버튼 상태 초기화
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
	
    // Discard Quiz 생성
    const quizArea = document.getElementById('quiz-area');
    if (quizArea) quizArea.style.display = 'block';

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

    currentHand = hand13;
    discardNewCard = newCard;

    renderHandWithDrawnCard();
    renderDiscardButtons();
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
}

// style.css의 .selection-grid 및 .btn-number 스타일 규격을 따르도록 수정된 버튼 생성 함수
function renderDiscardButtons() {
    const grid = document.getElementById('selection-buttons');
    if (!grid) return;
    
    // selection-grid 클래스 지정
    grid.className = 'selection-grid';
    grid.innerHTML = '';

    // 현재 14장에 포함된 패 카운트
    const fullHandCounts = Array(10).fill(0);
    if (Array.isArray(currentHand)) {
        currentHand.forEach(num => fullHandCounts[num]++);
    }
    if (discardNewCard) {
        fullHandCounts[discardNewCard]++;
    }

    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        // style.css에 정의된 .btn-number 클래스 적용
        btn.className = 'btn-number';
        btn.innerText = i;
        btn.dataset.number = i;

        // 손패에 없는 패인 경우: 비활성화 처리
        if (fullHandCounts[i] === 0) {
            btn.disabled = true;
            btn.style.opacity = '0.35';
            btn.style.cursor = 'not-allowed';
            btn.style.backgroundColor = '#e0e0e0';
            btn.style.borderColor = '#ccc';
        } else {
            // 손패에 존재하는 패인 경우 단일 선택 클릭 이벤트 연결
            btn.addEventListener('click', () => {
                if (typeof isSubmitted !== 'undefined' && isSubmitted) return;

                const allBtns = grid.querySelectorAll('.btn-number');
                allBtns.forEach(b => b.classList.remove('selected'));

                btn.classList.add('selected');

                if (typeof selectedTiles !== 'undefined') {
                    selectedTiles.clear();
                    selectedTiles.add(i);
                }
            });
        }

        grid.appendChild(btn);
    }
}

// 버림패 분석 상세 리포트 HTML 생성
function renderDiscardReportHTML(suitNum, hand13, newCard, userDiscard) {
    const results = check_flush_tenpai(suitNum, hand13, newCard, 1, []);

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
        const suitNum = getSafeSuitNum();

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

// 기존 메인 스크립트 이벤트 Hook 연동
(function initDiscardHooks() {
    const rawSubmit = window.handleSubmitOrNext;
    window.handleSubmitOrNext = function() {
        if (typeof currentMode !== 'undefined' && currentMode === 'discard') {
            handleDiscardModeSubmit();
        } else if (typeof rawSubmit === 'function') {
            rawSubmit.apply(this, arguments);
        }
    };

    const rawGenerateQuiz = window.generateQuiz;
    window.generateQuiz = function() {
        if (typeof currentMode !== 'undefined' && currentMode === 'discard') {
            if (typeof updateModeUI === 'function') updateModeUI();
            
            const quizArea = document.getElementById('quiz-area');
            if (quizArea) quizArea.style.display = 'block';

            generateDiscardQuiz();
            if (typeof selectedTiles !== 'undefined' && selectedTiles.clear) {
                selectedTiles.clear();
            }
        } else if (typeof rawGenerateQuiz === 'function') {
            rawGenerateQuiz.apply(this, arguments);
        }
    };
})();

// =================================================================
// 손패 디스플레이 컨트롤 (확대/축소 / 1줄·2줄 전환 / 방향 감지 / 초기화)
// =================================================================
let handScale = 1.0;          // 패 크기 비율 (0.6 ~ 1.5)
let isMultiLine = false;      // true: 2줄, false: 1줄
let userHasCustomized = false; // 사용자가 직접 조작했는지 여부

// 현재 화면 상태에 맞춰 기본 줄 수 설정 (사용자가 안 건드렸을 때만)
function applyAutoLineMode() {
    if (userHasCustomized) return; // 사용자가 수동 변경했으면 자동 전환 건너뜀

    const isPortraitMobile = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
    // 세로 모드 모바일이면 2줄, PC/가로 모드면 1줄이 기본
    isMultiLine = isPortraitMobile;
    updateHandDisplayLayout();
}

// UI 클래스 및 스케일 CSS 변수 업데이트
function updateHandDisplayLayout() {
    const container = document.getElementById('hand-container');
    if (!container) return;

    // 1줄 / 2줄 클래스 토글
    if (isMultiLine) {
        container.classList.remove('single-line');
        container.classList.add('multi-line');
    } else {
        container.classList.remove('multi-line');
        container.classList.add('single-line');
    }

    // 확대/축소 비율 적용
    container.style.setProperty('--tile-scale', handScale);
}

// 이벤트 리스너 바인딩
function initHandControls() {
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnLineToggle = document.getElementById('btn-line-toggle');
    const btnReset = document.getElementById('btn-hand-reset');

    // 축소 버튼
    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            if (handScale > 0.6) {
                handScale = parseFloat((handScale - 0.1).toFixed(1));
                userHasCustomized = true;
                updateHandDisplayLayout();
            }
        });
    }

    // 확대 버튼
    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            if (handScale < 1.6) {
                handScale = parseFloat((handScale + 0.1).toFixed(1));
                userHasCustomized = true;
                updateHandDisplayLayout();
            }
        });
    }

    // 1줄 / 2줄 전환 버튼
    if (btnLineToggle) {
        btnLineToggle.addEventListener('click', () => {
            isMultiLine = !isMultiLine;
            userHasCustomized = true;
            updateHandDisplayLayout();
        });
    }

    // 디폴트 초기화 버튼
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            userHasCustomized = false;
            handScale = 1.0;
            applyAutoLineMode(); // 자동 줄모드로 재설정 및 적용
        });
    }

    // 화면 방향 변경 및 해상도 변경 감지
    window.addEventListener('resize', applyAutoLineMode);
    window.addEventListener('orientationchange', applyAutoLineMode);

    // 최초 실행 시 기본 배치 설정
    applyAutoLineMode();
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', initHandControls);
