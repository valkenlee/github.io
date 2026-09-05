/* =============================================================
   📌 연승(Streak) 모드 전용 스크립트 (script_streak_mode.js)
   ============================================================= */


/**
 * streak 모드 타이머 중지 및 초기화
 */
function clearStreakTimer() {
    if (typeof timerInterval !== 'undefined' && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * streak 모드 타이머 시작
 */
function startTimer() {
    clearStreakTimer(); // 기존 실행 중인 타이머가 있다면 먼저 제거
    timeLeft = 60;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearStreakTimer(); // 타임아웃 시 타이머 중지
            handleTimeout();
        }
    }, 1000);
}

/**
 * streak 모드 타이머 UI 업데이트
 */
function updateTimerDisplay() {
    const timerElem = document.getElementById('timer-display');
    if (timerElem) {
        timerElem.innerText = t('timerSeconds', { count: timeLeft });
    }
    const gaugeBar = document.getElementById('timer-gauge-bar');
    if (gaugeBar) {
        const percentage = Math.max(0, (timeLeft / 60) * 100);
        gaugeBar.style.width = `${percentage}%`;
    }
}

/**
 * 제한시간 초과(타임아웃) 처리
 */
function handleTimeout() {
    isSubmitted = true;
    const tr = typeof t === 'function' ? t : (k, d) => d || k;
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'result-message incorrect';
        resultDiv.innerHTML = `${tr('timeout', '⏰ 제한시간 초과!')}<br>👉 ${getAnswerString()}`;
    }

    checkStreakRecordAndReset();

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        submitBtn.innerText = tr('btnNextSame', '다음 문제');
        submitBtn.style.backgroundColor = '#8e44ad';
    }
}

/**
 * 연승 모드 전용 결과 통계 기록 함수
 */
function processStreakResult() {
    const stats = getUserStats();
    const modeId = MODE_ID_MAP['streak']; // 연승 모드의 ID ('mode6')

    if (!stats[modeId]) {
        stats[modeId] = { playCount: 0, correct: 0, wrong: 0, max: 0 };
    }

    if (streakCount > stats[modeId].max) {
        stats[modeId].max = streakCount;
    }

    // 변경된 통계 데이터 localStorage에 저장
    localStorage.setItem('mahjong_user_stats', JSON.stringify(stats));
}

/**
 * 연승 기록 확인 및 카운트 리셋, 10연승 이상 시 이름 입력란 표시
 */
function checkStreakRecordAndReset() {
    processStreakResult();

    if (streakCount >= 10) {
        pendingRecordStreak = streakCount;
        const nameContainer = document.getElementById('name-input-container');
        if (nameContainer) nameContainer.style.display = 'block';
    }
    streakCount = 0;
}
