/* =============================================================
   📌 유저 고유 ID 관리 모듈 (script_id.js)
   ============================================================= */

/**
 * 20자 고유 ID 생성 함수
 * 규칙: ADJS + WORDS + 랜덤 숫자/알파벳 패딩 = 정확히 20자 (소문자/숫자)
 */
function generateUniqueUserId() {
    const chars = '0123456789';
    
    // 형용사 1개 + 명사 1개 무작위 선택
    const adj = ID_ADJS[Math.floor(Math.random() * ID_ADJS.length)];
    const word = ID_WORDS[Math.floor(Math.random() * ID_WORDS.length)];
    
    let combined = adj + word;
    
    // 20자를 초과하는 경우 자르기 (최소 패딩용 2자 공간 확보)
    if (combined.length > 18) {
        combined = combined.substring(0, 18);
    }

    // 정확히 20자가 되도록 부족한 길이는 무작위 숫자로 채움
    const remainingLength = 20 - combined.length;
    let randomPadding = '';
    
    for (let i = 0; i < remainingLength; i++) {
        randomPadding += chars[Math.floor(Math.random() * chars.length)];
    }

    return combined + randomPadding;
}

/**
 * 강제로 새 ID를 생성하고 저장 및 화면 갱신 (게임 기록은 그대로 유지)
 */
function regenerateUserId() {
    const newUserId = generateUniqueUserId();
    localStorage.setItem('mahjong_user_id', newUserId);

    // 화면 업데이트
    displayUserId();
}

/**
 * 게임 기록 전체 삭제 및 모달 테이블 초기화
 */
function resetUserStats() {
    if (confirm(t('stats.confirmReset'))) {
        localStorage.removeItem('mahjong_user_stats');
        openStatsModal();
    }
}

/**
 * 사용자 ID를 가져오거나 없으면 새로 생성 후 저장
 */
function getOrCreateUserId() {
    const STORAGE_KEY = 'mahjong_user_id';
    let userId = localStorage.getItem(STORAGE_KEY);

    if (!userId || userId.length !== 20) {
        userId = generateUniqueUserId();
        localStorage.setItem(STORAGE_KEY, userId);
    }

    return userId;
}

/**
 * 💡 호출 시점의 현재 언어(t)를 반영하여 6개 게임 모드 리스트를 반환하는 함수
 */
function getGameModes() {
    return [
        { id: 'mode0', name: t('modeVeryEasy') },
        { id: 'mode1', name: t('modeEasy') },
        { id: 'mode2', name: t('modeNormal') },
        { id: 'mode3', name: t('modeHard') },
        { id: 'mode4', name: t('modeBest') },
        { id: 'mode5', name: t('modeDiscard') },
        { id: 'mode6', name: t('modeStreak') }
    ];
}

/**
 * 저장된 기록 불러오기 (데이터가 없으면 0으로 초기화된 데이터 반환)
 */
function getUserStats() {
    const savedStats = localStorage.getItem('mahjong_user_stats');
    if (savedStats) {
        return JSON.parse(savedStats);
    }

    // 기본 데이터 구조 (현재는 저장된 데이터가 없으므로 0으로 초기화)
    const initialStats = {};
    getGameModes().forEach(mode => {
        initialStats[mode.id] = { playCount: 0, correct: 0, wrong: 0, max: 0 };
    });
    return initialStats;
}

/**
 * 기록 모달 열기 및 테이블 갱신
 */
function openStatsModal() {
    const stats = getUserStats();
    const tbody = document.getElementById('stats-table-body');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    // 모달을 열 때 최신 언어가 반영된 게임 모드 목록을 가져옴
    const gameModes = getGameModes();

    gameModes.forEach(mode => {
        const data = stats[mode.id] || { playCount: 0, correct: 0, wrong: 0, max: 0 };
        
        // 미제출 카운트 계산
        const playCount = data.playCount || 0;
        const correct = data.correct || 0;
        const wrong = data.wrong || 0;
        const unsubmitted = Math.max(0, playCount - correct - wrong);

        // 📌 정답률1 (미제출 미고려: correct / (correct + wrong) * 100)
        let rate1Text = '-';
        const totalSubmitted = correct + wrong;
        if (totalSubmitted > 0) {
            const rate1 = ((correct / totalSubmitted) * 100).toFixed(1);
            rate1Text = `${rate1}%`;
        }

        // 📌 정답률2 (미제출 고려: correct / playCount * 100)
        let rate2Text = '-';
        if (playCount > 0) {
            const rate2 = ((correct / playCount) * 100).toFixed(1);
            rate2Text = `${rate2}%`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mode.name}</td>
            <td>${playCount}</td>
            <td class="txt-correct">${correct}</td>
            <td class="txt-wrong">${wrong}</td>
            <td class="txt-unsubmitted">${unsubmitted}</td>
            <td class="txt-rate1">${rate1Text}</td>
            <td class="txt-rate2">${rate2Text}</td>
            <td class="txt-max">${data.max || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('stats-modal').style.display = 'flex';
}

/**
 * 기록 모달 닫기
 */
function closeStatsModal() {
    document.getElementById('stats-modal').style.display = 'none';
}

// 모달 바깥 배경 클릭 시 닫기
window.addEventListener('click', (event) => {
    const modal = document.getElementById('stats-modal');
    if (event.target === modal) {
        closeStatsModal();
    }
});


/**
 * UI 상단에 ID 표시 함수
 */
function displayUserId() {
    const userId = getOrCreateUserId();
    
    // 메인 헤더 영역 PID 갱신
    const userIdElem = document.getElementById('user-id-display');
    if (userIdElem) {
        userIdElem.innerText = userId;
    }
    
    // 모달 내 PID 갱신
    const modalUserIdElem = document.getElementById('modal-user-id-display');
    if (modalUserIdElem) {
        modalUserIdElem.innerText = userId;
    }
}

// DOM이 준비되면 바로 실행하여 화면에 표시
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayUserId);
} else {
    displayUserId();
}


