/* =============================================================
   📌 (Last Updated: 2026-08-31)
   ============================================================= */
console.log(`[App Initialized] Version: ${APP_VERSION}`);

/**
 * 특정 모드의 playCount 를 1 증가시키는 함수
 */
function incrementPlayCount(modeKey) {
    const stats = getUserStats();
    const modeId = MODE_ID_MAP[modeKey];

    if (modeId && stats[modeId]) {
        stats[modeId].playCount = (stats[modeId].playCount || 0) + 1;
        localStorage.setItem('mahjong_user_stats', JSON.stringify(stats));
    }
}

function selectMode(mode) {
    if (currentMode !== mode) streakCount = 0;
    currentMode = mode;

    // 📌 해당 모드의 playCount 1 증가
    incrementPlayCount(mode);

    generateQuiz();
}

function updateModeUI() {
    document.querySelectorAll('.btn-diff').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-mode-${currentMode}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 📌 quizInstruction 안내문구 갱신 로직
    const instructionElem = document.getElementById('quiz-instruction');
    if (instructionElem) {
        let key = 'quizInstruction';
        if (currentMode === 'best')
            key = 'quizInstruction_best';
        else if (currentMode === 'discard')
            key = 'quizInstruction_discard';
        instructionElem.innerHTML = t(key);
    }

    const infoBox = document.getElementById('mode-info-box');

    infoBox.innerHTML = t(`descriptions.${currentMode}`) || '';
    infoBox.style.backgroundColor = '#f8f9fa';
    infoBox.style.borderColor = '#ced4da';
    infoBox.style.color = '#2c3e50';

    infoBox.style.display = 'block';
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

    // 레이아웃 스케일 및 줄 적용 (script_gameboard.js 연동)
    if (typeof updateHandDisplayLayout === 'function') {
        updateHandDisplayLayout();
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

    const isAlreadySelected = selectedTiles.has(num);

    // best 모드일 경우: 단일 선택 동작
    if (currentMode === 'best') {
        // 1. 기존에 선택되어 있던 모든 버튼의 selected 클래스 제거
        document.querySelectorAll('.btn-number.selected').forEach(b => b.classList.remove('selected'));
        // 2. Set 데이터 초기화
        selectedTiles.clear();

        // 3. 이미 선택되었던 것을 다시 누른 게 아니라면 -> 새 번호만 선택
        if (!isAlreadySelected) {
            selectedTiles.add(num);
            btn.classList.add('selected');
        }
    }
    // 기존 다중 선택 모드
    else {
        if (isAlreadySelected) {
            selectedTiles.delete(num);
            btn.classList.remove('selected');
        } else {
            selectedTiles.add(num);
            btn.classList.add('selected');
        }
    }
}


/**
 * 정답 여부에 따라 현재 모드의 correct / wrong 1 증가시키는 함수
 */
function recordAnswerResult(isCorrect) {
    const stats = getUserStats();
    const modeId = MODE_ID_MAP[currentMode];

    if (modeId && stats[modeId]) {
        if (isCorrect) {
            stats[modeId].correct = (stats[modeId].correct || 0) + 1;
        } else {
            stats[modeId].wrong = (stats[modeId].wrong || 0) + 1;
        }
        localStorage.setItem('mahjong_user_stats', JSON.stringify(stats));
    }
}

function handleSubmitOrNext() {
    // 모드별 전용 처리 분기
    if (currentMode === 'discard' && typeof handleDiscardModeSubmit === 'function') {
        handleDiscardModeSubmit();
        return;
    }
    if (currentMode === 'best' && typeof handleBestModeSubmit === 'function') {
        handleBestModeSubmit();
        return;
    }

    // 기본(normal, easy, hard, streak) 제출 및 다음 문제 처리 로직
    // 📌 이미 제출한 상태에서 버튼을 누른 경우 (새 문제 출제 시점)
    if (isSubmitted) { 
        incrementPlayCount(currentMode); // 다음 문제 시작 시 playCount 1 증가
        generateQuiz(); 
        return; 
    }

    const resultDiv = document.getElementById('result');
    if (!selectedTiles || selectedTiles.size === 0) {
        if (resultDiv) {
            resultDiv.className = 'result-message incorrect';
            resultDiv.innerHTML = `⚠️ <b>${t('alertSelectTile', '오름패를 최소 1개 이상 선택해 주세요.')}</b>`;
            resultDiv.style.display = 'block';
        }
        return;
    }

    clearInterval(timerInterval);
    const userAnswers = Array.from(selectedTiles).sort((a, b) => a - b);

    const isCorrectActual = userAnswers.length === winningTiles.length &&
                            userAnswers.every((val, idx) => val === winningTiles[idx]);

    const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
    const isCorrectTheoretical = userAnswers.length === theoreticalList.length &&
                                userAnswers.every((val, idx) => val === theoreticalList[idx]);

    const isCorrect = isCorrectActual || isCorrectTheoretical;

    // 📌 정답/오답 결과 통계 반영
    recordAnswerResult(isCorrect);

    resultDiv.style.display = 'block';

    const answerText = getAnswerString();

    if (isCorrect) {
        resultDiv.className = 'result-message correct';
        resultDiv.innerHTML = `${t('correct')}<br>👉 ${answerText}`;
    } else {
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `${t('incorrect')}<br>👉 ${answerText}`;
    }

    // 연승 모드에서 연승 관리 (script_streak_mode.js 함수 연동)
    if (currentMode === 'streak') {
        if (isCorrect) {
            streakCount++;
            const streakDisplay = document.getElementById('streak-display');
            if (streakDisplay) {
                streakDisplay.innerText = t('streakCount', { count: streakCount });
            }
            if (typeof processStreakResult === 'function') {
                processStreakResult();
            }
        } else {
            if (typeof checkStreakRecordAndReset === 'function') {
                checkStreakRecordAndReset();
            }
        }
    }   

    isSubmitted = true;
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = currentMode === 'streak' ? t('btnNextStreak') : t('btnNextSame');
    submitBtn.style.backgroundColor = currentMode === 'streak' ? '#8e44ad' : '#27ae60';
}

function copyCurrentQuizToCustom() {
    if (!currentHand || currentHand.length !== 13) {
        alert('No quiz data');
        return;
    }
    customHand = [...currentHand];
    if (typeof currentSuitObj !== 'undefined' && currentSuitObj && currentSuitObj.code) {
        customSuitCode = currentSuitObj.code;
    }
    const textInput = document.getElementById('custom-text-input');
    if (textInput) textInput.value = customHand.join('');

    updateCustomHandDisplay();
}

/* ==========================================
   📌 앱 초기화 함수 정의
   ========================================== */
async function initApp() {
    console.log('[DEBUG] App Initialization Started');
    loadLeaderboard();
    initTitleClickTrigger();
    renderCustomButtons();
    updateModeUI();

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
}

/* ==========================================
   📌 initApp() 자동으로 실행하기 (script.js 최하단에 배치)
   ========================================== */
if (document.readyState === 'loading') {
    // 아직 DOM을 읽는 중이라면 이벤트 대기
    window.addEventListener('DOMContentLoaded', () => {
        console.log('[DEBUG] DOMContentLoaded fired!');
        initApp();
    });
} else {
    // 이미 DOM 완성을 마친 상태라면 즉시 실행
    console.log('[DEBUG] DOM already loaded, running initApp immediately.');
    initApp();
}
