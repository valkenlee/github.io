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


/* =============================================================
   📌 script_loadimg.js - getTileImageSrc 버그 수정
   ============================================================= */

async function getTileImageSrc(suitCode, num) {
    // 1. 자패 명칭 변환 매핑 (ZIP 내 파일명 기준)
    const honorFileMap = {
        'Ton': 'Ton.svg',
        'Nan': 'Nan.svg',
        'Sha': 'Shaa.svg',
        'Shaa': 'Shaa.svg',
        'Pei': 'Pei.svg',
        'Haku': 'Haku.svg',
        'Hatsu': 'Hatsu.svg',
        'Chun': 'Chun.svg'
    };

    let targetName = '';

    // 1. suitCode 자체가 자패 명칭('Ton', 'Nan' 등)인 경우
    if (honorFileMap[suitCode]) {
        targetName = honorFileMap[suitCode];
    } 
    // 2. num에 자패 명칭이 전달된 경우
    else if (honorFileMap[num]) {
        targetName = honorFileMap[num];
    }
    // 3. suitCode가 'Honor' 또는 'Z'이고 num이 숫자인 경우 (1~7)
    else if ((suitCode === 'Honor' || suitCode === 'Z') && typeof num === 'number') {
        const honorKeys = ['Ton', 'Nan', 'Sha', 'Pei', 'Haku', 'Hatsu', 'Chun'];
        const key = honorKeys[num - 1];
        targetName = honorFileMap[key] || `${key}.svg`;
    } 
    // 4. 일반 수패
    else {
        targetName = `${suitCode}${num}.svg`;
    }

    const cacheKey = targetName;
    if (tileSvgCache[cacheKey]) return tileSvgCache[cacheKey];

    // ZIP 파일 대기
    if (!zipInstance) {
        await zipReadyPromise;
    }

    if (!zipInstance) {
        console.warn(`[loadimg] ZIP 파일이 존재하지 않습니다.`);
        return '';
    }

    // 3. ZIP 내에서 정확한 파일 검색 (경로 구분자 고려)
    let targetFile = null;
    zipInstance.forEach((relativePath, file) => {
        // 파일명이 정확히 일치하거나 경로 끝자리가 일치하는지 확인
        if (relativePath === targetName || relativePath.endsWith('/' + targetName)) {
            targetFile = file;
        }
    });

    if (targetFile) {
        try {
            const text = await targetFile.async('string');
            const blob = new Blob([text], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            tileSvgCache[cacheKey] = url;
            return url;
        } catch (e) {
            console.error(`[loadimg] ${targetName} 변환 실패:`, e);
            return '';
        }
    }

    console.warn(`[loadimg] ZIP 내부에서 [${targetName}] 파일을 찾지 못했습니다.`);
    return '';
}
