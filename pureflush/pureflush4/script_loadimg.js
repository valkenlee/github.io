/* =============================================================
   📌 script_loadimg.js - 마작패 이미지 로딩 및 ZIP 해제 모듈
   ============================================================= */

let zipInstance = null;
const tileSvgCache = {};
let zipReadyResolve = null;

// ZIP 로딩 완료 여부를 외부에서 await 할 수 있는 Promise 객체
const zipReadyPromise = new Promise((resolve) => {
    zipReadyResolve = resolve;
});

// DOMReady 및 즉시 실행 보장
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initTileZip);
} else {
    initTileZip();
}

async function initTileZip() {
    const statusElem = document.getElementById('status-msg');
    if (statusElem) statusElem.innerText = '패 이미지 로딩 중...';

    try {
        // 경로 지정 (절대 경로 또는 현재 경로 상대 지정)
        const zipUrl = './Regular.zip';
        
        // 10초 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(zipUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP 에러! 상태 코드: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();

        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip 라이브러리가 로드되지 않았습니다.');
        }

        zipInstance = await JSZip.loadAsync(arrayBuffer);
        
        const successMsg = (typeof window.t === 'function') ? window.t('loadingSuccess') : '패 이미지 로딩 완료!';

        if (statusElem) {
            statusElem.style.color = '#27ae60';
            statusElem.innerText = successMsg;
        }

        // 버튼 활성화
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);

        // 대기 중인 Promise 해제
        if (zipReadyResolve) zipReadyResolve(true);

    } catch (err) {
        console.error('[loadimg] ZIP 로딩 또는 초기화 실패:', err);

        const errorMsg = (typeof window.t === 'function') ? window.t('loadingError') : `패 이미지 로딩 실패 (${err.message})`;
        if (statusElem) {
            statusElem.style.color = '#e74c3c';
            statusElem.innerText = errorMsg;
        }
        // 에러가 발생해도 무한 대기를 방지하기 위해 Promise 해결 처리
        if (zipReadyResolve) zipReadyResolve(false);
    }
}

async function getTileImageSrc(suitCode, num) {
    const targetName = `${suitCode}${num}.svg`;
    const cacheKey = `${suitCode}${num}`;
    if (tileSvgCache[cacheKey]) return tileSvgCache[cacheKey];

    // ZIP 파일 로드가 완료될 때까지 비동기 대기
    if (!zipInstance) {
        console.log(`[loadimg] ${suitCode}${num} 로드를 위해 ZIP 대기 중...`);
        await zipReadyPromise;
    }

    if (!zipInstance) {
        console.warn(`[loadimg] ZIP 파일이 로드되지 않아 ${targetName}을 불러올 수 없습니다.`);
        return '';
    }

    let targetFile = null;
    zipInstance.forEach((relativePath, file) => {
        if (relativePath.endsWith(targetName)) targetFile = file;
    });

    if (targetFile) {
        const text = await targetFile.async('string');
        const blob = new Blob([text], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        tileSvgCache[cacheKey] = url;
        return url;
    }
    
    console.warn(`[loadimg] ZIP 내부에서 ${targetName} 파일을 찾지 못했습니다.`);
    return '';
}
