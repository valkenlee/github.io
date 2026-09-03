/**
 * 마작패 디스플레이 및 보드 제어 스크립트 (script_gameboard.js)
 */

let handScale = 1.0;          // 패 크기 비율 (0.6 ~ 1.5)
let isMultiLine = false;      // true: 2줄, false: 1줄
let userHasCustomized = false; // 사용자가 직접 조작했는지 여부

// 현재 화면 상태에 맞춰 기본 줄 수 설정 (사용자가 안 건드렸을 때만)
function applyAutoLineMode() {
    if (userHasCustomized) return;

    const isPortraitMobile = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
    isMultiLine = isPortraitMobile;
    updateHandDisplayLayout();
}

// UI 클래스 및 스케일 CSS 변수 업데이트
function updateHandDisplayLayout() {
    // hand-container 및 hand-display ID/클래스 모두 대응
    const container = document.getElementById('hand-container') || document.getElementById('hand-display') || document.querySelector('.hand-display');
    if (!container) return;

    // 1줄 / 2줄 클래스 토글
    if (isMultiLine) {
        container.classList.remove('single-line');
        container.classList.add('multi-line');
    } else {
        container.classList.remove('multi-line');
        container.classList.add('single-line');
    }

    // 확대/축소 비율 CSS 변수 적용
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
        btnZoomOut.onclick = () => {
            if (handScale > 0.6) {
                handScale = parseFloat((handScale - 0.1).toFixed(1));
                userHasCustomized = true;
                updateHandDisplayLayout();
            }
        };
    }

    // 확대 버튼
    if (btnZoomIn) {
        btnZoomIn.onclick = () => {
            if (handScale < 1.6) {
                handScale = parseFloat((handScale + 0.1).toFixed(1));
                userHasCustomized = true;
                updateHandDisplayLayout();
            }
        };
    }

    // 1줄 / 2줄 전환 버튼
    if (btnLineToggle) {
        btnLineToggle.onclick = () => {
            isMultiLine = !isMultiLine;
            userHasCustomized = true;
            updateHandDisplayLayout();
        };
    }

    // 디폴트 초기화 버튼
    if (btnReset) {
        btnReset.onclick = () => {
            userHasCustomized = false;
            handScale = 1.0;
            applyAutoLineMode();
        };
    }

    // 화면 방향 변경 및 해상도 변경 감지
    window.addEventListener('resize', applyAutoLineMode);
    window.addEventListener('orientationchange', applyAutoLineMode);

    // 최초 실행 시 기본 배치 설정
    applyAutoLineMode();
}

// DOM 로드 완료 여부에 따른 초기화 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandControls);
} else {
    initHandControls();
}