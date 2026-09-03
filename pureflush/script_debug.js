let debug = "false";

function setupDebug() {
    // 🔍 함수가 실제로 실행되는지 확인하는 로그
    console.log('[DEBUG] setupDebug() .');
}

// 단순 addEventListener 대신 readyState 체크 후 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDebug);
} else {
    // 이미 DOM 로드가 완료된 경우 즉시 실행
    setupDebug();
}
