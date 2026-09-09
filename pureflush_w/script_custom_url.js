/**
 * script_custom_url.js
 * URL Query Parameter (?problem=...&suit=...&difficult=...) 수동 입력 파싱 및 처리 모듈
 */

// URL 파라미터 수동 입력 처리 메인 함수
function checkAndLoadCustomUrlProblem() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // problem 파라미터 추출 (13자리 숫자 패 또는 버리기 모드용 14자리)
    const problemTiles = urlParams.get('problem');
    if (!problemTiles) return false;

    // 수트(종류) 지정: 1 = 만수(m), 2 = 통수(p), 3 = 삭수(s) (기본값: 만수 1)
    const suitParam = urlParams.get('suit') || urlParams.get('suit_type') || '1';
    
    // 난이도/모드 지정: veryEasy, easy, normal, hard, best, discard 등 (기본값: hard)
    // 오타 방지용 (difficult -> hard 매핑 지원)
    let difficultParam = urlParams.get('difficult') || urlParams.get('diffcult') || urlParams.get('mode') || 'hard';

    // 수트 패 변환 매핑
    const suitMap = {
        '1': 'm', 'm': 'm', 'man': 'm',
        '2': 'p', 'p': 'p', 'pin': 'p',
        '3': 's', 's': 's', 'sou': 's'
    };
    const selectedSuit = suitMap[suitParam] || 'm';

    // 문제 데이터 검증 및 생성
    const customQuizData = buildCustomQuizObject(problemTiles, selectedSuit, difficultParam);
    
    if (customQuizData) {
        console.log("🔗 URL 수동 입력 문제 로드 완료:", customQuizData);
        launchCustomUrlQuiz(customQuizData, difficultParam);
        return true;
    } else {
        const errorMsg = typeof t === 'function' ? t('share.invalidUrlParam') : "⚠️ 올바르지 않은 문제 URL 파라미터 형식입니다.";
        alert(errorMsg);
        return false;
    }
}

/**
 * URL 파라미터를 기반으로 기존 퀴즈 객체 구조 데이터 생성
 */
function buildCustomQuizObject(tilesStr, suit, mode) {
    const cleanTiles = tilesStr.replace(/[^1-9]/g, '');
    
    // mode가 'discard'가 아니더라도 입력된 길이가 13장/14장이 맞는지 유연하게 검증[cite: 1]
    if (cleanTiles.length !== 13 && cleanTiles.length !== 14) {
        console.warn(`[URL Parsing Error] 패 개수 오류: 현재 ${cleanTiles.length}장 (13장 또는 14장 필요)`);
        return null;
    }

    const sortedTiles = cleanTiles.split('').sort((a, b) => Number(a) - Number(b)).join('');
    
    return {
        hand: sortedTiles,
        suit: suit,
        difficulty: mode,
        isCustomUrlProblem: true,
        waits: typeof calculateWaits === 'function' ? calculateWaits(sortedTiles) : []
    };
}



/**
 * 파싱된 수동 문제로 게임 화면 전환 및 시작
 */
function launchCustomUrlQuiz(quizData, mode) {
    // 1. 해당 모드 선택 상태 변경
    if (typeof selectMode === 'function') {
        selectMode(mode);
    }

    // 2. 글로벌 현재 문제 변수에 할당 (script.js 또는 global state 준수)
    if (typeof window.currentQuiz !== 'undefined') {
        window.currentQuiz = quizData;
    }

    // 3. 게임 시작 버튼 영역 및 디스플레이 노출
    const startBtn = document.getElementById('btn-start-game');
    const gameArea = document.getElementById('game-play-area');
    const quizArea = document.getElementById('quiz-area');

    if (startBtn) startBtn.style.display = 'none'; // 공유 링크는 바로 플레이 가능하도록 시작버튼 숨김 가능
    if (gameArea) gameArea.style.display = 'block';
    if (quizArea) quizArea.style.display = 'block';

    // 4. 손패 및 UI 렌더링 호출
    if (typeof renderHand === 'function') {
        renderHand(quizData.hand, quizData.suit);
    }
    if (typeof renderSelectionButtons === 'function') {
        renderSelectionButtons(mode);
    }

    // 5. 커스텀 안내 메시지 표시 (필요시)
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = `🔗 <strong>[공유된 지정 문제]</strong>가 로드되었습니다! (패: ${quizData.hand})`;
        statusMsg.style.color = '#2980b9';
    }
}

/**
 * [추가 유틸리티] 현재 지정한 문제를 URL 공유 링크 형태로 생성하여 클립보드에 복사
 */
function copyShareUrl(tiles, suit = 1, difficult = 'hard') {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?problem=${tiles}&suit=${suit}&difficult=${difficult}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert("🔗 문제 공유 링크가 클립보드에 복사되었습니다!\n" + shareUrl);
    }).catch(err => {
        console.error("클립보드 복사 실패:", err);
    });
}


/**
 * 현재 로드된 퀴즈 공유 링크 생성 및 클립보드 복사 함수 (멀티 탐색 & DOM 추적 적용)
 */
function shareCurrentQuiz() {
    let handStr = "";
    let suitVal = 1;

    // 1. 전역 변수에서 패 배열/문자열 추출 시도 (currentHand, currentQuiz, currentProblem 등)
    if (window.currentHand && Array.isArray(window.currentHand) && window.currentHand.length > 0) {
        handStr = window.currentHand.join('');
    } else if (window.currentQuiz && window.currentQuiz.hand) {
        handStr = window.currentQuiz.hand;
    } else if (window.currentProblem && window.currentProblem.hand) {
        handStr = window.currentProblem.hand;
    }

    // 2. 만약 변수에서 찾지 못했다면: 화면의 #hand-container DOM 요소에서 이미지/텍스트 추출
    if (!handStr) {
        const handContainer = document.getElementById('hand-container');
        if (handContainer) {
            const imgs = handContainer.querySelectorAll('img');
            const extracted = [];
            imgs.forEach(img => {
                // 이미지 src나 alt/data 속성에서 숫자 패 추출 (예: m1.png, 1.png, alt="1" 등)
                const srcMatch = img.src ? img.src.match(/([1-9])\.(png|svg|webp|jpg)/i) : null;
                const altMatch = img.alt ? img.alt.match(/([1-9])/) : null;
                const tileNum = srcMatch ? srcMatch[1] : (altMatch ? altMatch[1] : null);
                
                if (tileNum) {
                    extracted.push(tileNum);
                }

                // 수트 패(만/통/삭) 추출
                if (img.src && img.src.includes('Pin')) suitVal = 2;
                else if (img.src && img.src.includes('Sou')) suitVal = 3;
            });

            if (extracted.length >= 13) {
                // 숫자로 오름차순 정렬하여 패 문자열 생성
                handStr = extracted.sort((a, b) => Number(a) - Number(b)).join('');
            }
        }
    }

    // 3. 수트(종류) 변환 (Man: 1, Pin: 2, Sou: 3)
    if (window.currentSuitObj && window.currentSuitObj.code) {
        const code = window.currentSuitObj.code;
        if (code === 'Pin' || code === 'pin' || code === 'p') suitVal = 2;
        else if (code === 'Sou' || code === 'sou' || code === 's') suitVal = 3;
        else suitVal = 1;
    }

    // 4. 패를 끝내 찾지 못한 경우
    if (!handStr) {
        alert("⚠️ 현재 화면에서 공유할 문제 패를 찾지 못했습니다.\n게임 시작 후 다시 시도해 주세요.");
        return;
    }

    // 5. 모드 값 추출
    const modeVal = window.currentMode || 'hard';

    // 6. URL 파라미터 생성 및 복사 실행
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?problem=${handStr}&suit=${suitVal}&difficult=${modeVal}`;

    executeShareCopyUrl(shareUrl);
}

// 클립보드 복사 실행 공통 함수
function executeShareCopyUrl(shareUrl) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("🔗 문제 공유 링크가 클립보드에 복사되었습니다!\n\n" + shareUrl);
        }).catch(() => {
            fallbackCopyUrlText(shareUrl);
        });
    } else {
        fallbackCopyUrlText(shareUrl);
    }
}

// 구형/비보안 환경용 복사
function fallbackCopyUrlText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert("🔗 문제 공유 링크가 복사되었습니다!\n\n" + text);
        } else {
            prompt("아래 링크를 복사하세요:", text);
        }
    } catch (err) {
        prompt("아래 링크를 복사하세요:", text);
    }
    document.body.removeChild(textArea);
}

// 공유 알림(토스트/얼럿) 처리
function showShareToast(message) {
    alert(message);
}


// 2. 페이지 로드 시 자동 진입점 추가[cite: 1]
window.addEventListener('DOMContentLoaded', () => {
    // 메인 스크립트의 초기화가 완료된 후 실행되도록 약 100ms 지연 호출[cite: 1]
    setTimeout(() => {
        checkAndLoadCustomUrlProblem();
    }, 100);
});
