/* =============================================================
   📌 script_loadimg.js - 스킨 변경 및 ZIP 로딩 통합 모듈
   ============================================================= */

let zipInstance = null;
let tileSvgCache = {};
let zipReadyResolve = null;

// ZIP 로딩 완료 여부를 외부에서 await 할 수 있는 Promise 객체
let zipReadyPromise = new Promise((resolve) => {
    zipReadyResolve = resolve;
});

/**
 * 지정된 ZIP 스킨 파일을 네트워크에서 불러와 zipInstance 및 캐시를 갱신하는 핵심 함수
 */
async function loadTileZipPackage(zipFileName) {
    const statusElem = document.getElementById('status-msg');
    if (statusElem) {
        statusElem.style.display = 'block';
        statusElem.innerText = `📦 스킨(${zipFileName}) 로딩 중...`;
    }

    // 새로운 로딩을 위해 Promise 재생성
    zipReadyPromise = new Promise((resolve) => {
        zipReadyResolve = resolve;
    });

    try {
        const zipUrl = `./${zipFileName}`;
        
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

        // 1. 기존 SVG 캐시 및 Object URL 메모리 해제
        for (const key in tileSvgCache) {
            if (tileSvgCache[key]) {
                URL.revokeObjectURL(tileSvgCache[key]);
            }
        }
        tileSvgCache = {};

        // 2. 새로운 ZIP 인스턴스 로드
        zipInstance = await JSZip.loadAsync(arrayBuffer);
        window.currentTileSkinZip = zipFileName;
        
        const successMsg = (typeof window.t === 'function') ? window.t('loadingSuccess') : '패 이미지 로딩 완료!';

        if (statusElem) {
            statusElem.style.color = '#27ae60';
            statusElem.innerText = successMsg;
            setTimeout(() => {
                if (window.gameStarted) statusElem.style.display = 'none';
            }, 1200);
        }

        // 난이도 버튼 활성화
        document.querySelectorAll('.btn-diff').forEach(btn => btn.disabled = false);

        // 대기 중인 Promise 해제
        if (zipReadyResolve) zipReadyResolve(true);
        return true;

    } catch (err) {
        console.error('[loadimg] ZIP 로딩 또는 초기화 실패:', err);

        const errorMsg = (typeof window.t === 'function') ? window.t('loadingError') : `패 이미지 로딩 실패 (${err.message})`;
        if (statusElem) {
            statusElem.style.color = '#e74c3c';
            statusElem.innerText = errorMsg;
        }
        if (zipReadyResolve) zipReadyResolve(false);
        throw err;
    }
}

/* =============================================================
   📌 getTileImageSrc - 이미지 변환 및 캐싱 함수
   ============================================================= */

async function getTileImageSrc(suitCode, num) {
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

    if (honorFileMap[suitCode]) {
        targetName = honorFileMap[suitCode];
    } else if (honorFileMap[num]) {
        targetName = honorFileMap[num];
    } else if ((suitCode === 'Honor' || suitCode === 'Z') && typeof num === 'number') {
        const honorKeys = ['Ton', 'Nan', 'Sha', 'Pei', 'Haku', 'Hatsu', 'Chun'];
        const key = honorKeys[num - 1];
        targetName = honorFileMap[key] || `${key}.svg`;
    } else {
        targetName = `${suitCode}${num}.svg`;
    }

    const cacheKey = targetName;
    if (tileSvgCache[cacheKey]) return tileSvgCache[cacheKey];

    // ZIP 로딩 대기
    if (!zipInstance) {
        await zipReadyPromise;
    }

    if (!zipInstance) {
        console.warn(`[loadimg] ZIP 파일이 존재하지 않습니다.`);
        return '';
    }

    // 대소문자 및 경로 구분자 무시 검색
    let targetFile = null;
    const lowerTarget = targetName.toLowerCase();

    zipInstance.forEach((relativePath, file) => {
        const lowerPath = relativePath.toLowerCase();
        if (lowerPath === lowerTarget || lowerPath.endsWith('/' + lowerTarget)) {
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

/**
 * 스킨 변경 이벤트 핸들러 (라디오 버튼 change/click 시 실행)
 */
async function changeTileSkin(zipFileName) {
    console.log(`[Skin Change] 스킨 변경 요청: ${zipFileName}`);

    // 1. 선택한 스킨 LocalStorage 저장
    localStorage.setItem('selectedTileSkinZip', zipFileName);

    try {
        // 2. 새로운 ZIP 로드
        await loadTileZipPackage(zipFileName);

        // 3. 현재 수패 정보 예외 방어
        if (typeof currentSuitObj === 'undefined' || !currentSuitObj) {
            if (typeof SUITS !== 'undefined' && SUITS.length > 0) {
                currentSuitObj = SUITS[0];
            }
        }

        // 4. 화면 렌더링 갱신
        if (typeof renderQuizUI === 'function') {
            await renderQuizUI();
        } else if (typeof renderHand === 'function') {
            await renderHand();
        }

        if (typeof renderCustomHand === 'function') {
            renderCustomHand();
        }

        console.log(`[Skin Change] ${zipFileName} 적용 완료!`);
    } catch (err) {
        console.error('[Skin Change ERROR] 스킨 변경 실패:', err);
        alert(`스킨 로드에 실패했습니다: ${err.message}`);
    }
}


/**
 * 지정된 ZIP 파일 내부에서 특정 SVG 파일(예: Man2.svg, Pin3.svg, Sou4.svg)을 찾아 SVG Object URL을 생성하는 함수
 * (getTileImageSrc의 파일 검색 및 디렉토리 대응 로직 구조 활용)
 */
async function getTileSvgUrlFromZip(zip, targetFileName) {
    let targetFile = null;
    const lowerTarget = targetFileName.toLowerCase();

    // ZIP 내부 디렉토리 구조 및 대소문자 무시 검색 (getTileImageSrc 함수 참조)
    zip.forEach((relativePath, file) => {
        const lowerPath = relativePath.toLowerCase();
        if (lowerPath === lowerTarget || lowerPath.endsWith('/' + lowerTarget)) {
            targetFile = file;
        }
    });

    if (targetFile) {
        try {
            const svgText = await targetFile.async('string');
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error(`[Skin Preview Error] ${targetFileName} 변환 실패:`, e);
        }
    }
    return null;
}

/**
 * 스킨 선택창의 각 카드에 Man2.svg, Pin3.svg, Sou4.svg 패를 로드하여 표시
 */
async function loadSkinPreviews() {
    const previewContainers = document.querySelectorAll('.skin-preview');
    if (!previewContainers.length) return;

    // 타겟 SVG 파일명 지정
    const targets = [
        { name: 'Man2.svg', label: 'Man2' },
        { name: 'Pin3.svg', label: 'Pin3' },
        { name: 'Sou4.svg', label: 'Sou4' }
    ];

    for (const container of previewContainers) {
        // 이미 <img> 태그가 정상적으로 생성되어 있으면 건너뜀
        if (container.querySelectorAll('img').length === targets.length) continue;

        const zipFileName = container.getAttribute('data-skin');
        if (!zipFileName) continue;

        try {
            // 1. ZIP 파일 읽기
            const response = await fetch(`./${zipFileName}`);
            if (!response.ok) continue;

            const arrayBuffer = await response.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            // 기존 영역 초기화
            container.innerHTML = '';

            // 2. target별 SVG 검색 및 렌더링
            for (const target of targets) {
                const svgUrl = await getTileSvgUrlFromZip(zip, target.name);

                if (svgUrl) {
                    const img = document.createElement('img');
                    img.src = svgUrl;
                    img.alt = target.label;
                    img.className = 'skin-preview-tile';
                    container.appendChild(img);
                }
            }
        } catch (err) {
            console.error(`[Skin Preview Error] ${zipFileName} 로딩 실패:`, err);
        }
    }
}


// 설정 모달이 열리는 함수(openSettingsModal) 호출 시 함께 실행되도록 연동
const originalOpenSettingsModal = window.openSettingsModal;
window.openSettingsModal = function() {
    if (typeof originalOpenSettingsModal === 'function') {
        originalOpenSettingsModal();
    }
    loadSkinPreviews();
};

/**
 * 스킨 시스템 초기화 및 라디오 버튼 이벤트 등록
 */
function initTileSkinSystem() {
    const savedZip = localStorage.getItem('selectedTileSkinZip') || 'Set_01_Standard.zip';

    // 라디오 버튼 상태 세팅 및 이벤트 바인딩
    const skinRadios = document.querySelectorAll('input[name="tile-skin"]');
    skinRadios.forEach(radio => {
        if (radio.value === savedZip) {
            radio.checked = true;
        }

        radio.addEventListener('change', (e) => {
            changeTileSkin(e.target.value);
        });
    });

    // 초기에 저장된 스킨 패키지 로드
    loadTileZipPackage(savedZip);
}

// DOM 준비 완료 시 단 1회 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTileSkinSystem);
} else {
    initTileSkinSystem();
}
