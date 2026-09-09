/* =============================================================
   📌 언어 및 다국어 처리 모듈 (script_lang.js)
   ============================================================= */

/**
 * 점(.)으로 구분된 중첩 키(예: 'stats.title')를 객체에서 찾아 텍스트를 반환하는 함수
 */
function getNestedTranslation(obj, path) {
    if (!obj || !path) return null;
    return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : null, obj);
}

/**
 * 전역 번역 헬퍼 함수
 */
function t(key, params = {}) {
    const lang = window.currentLang || 'ko';
    let text = getNestedTranslation(TRANSLATIONS[lang], key) || getNestedTranslation(TRANSLATIONS['ko'], key) || key;
    
    // {count}, {tiles} 등의 치환 파라미터 처리
    Object.keys(params).forEach(pKey => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
    });
    return text;
}

/**
 * 화면 전체의 data-i18n, data-i18n-placeholder 속성을 일괄 번역 적용
 */
function applyTranslations() {
    const lang = window.currentLang || 'ko';

    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        const translation = getNestedTranslation(TRANSLATIONS[lang], key);
        if (translation) {
            elem.innerHTML = translation;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-placeholder');
        const translation = getNestedTranslation(TRANSLATIONS[lang], key);
        if (translation) {
            elem.placeholder = translation;
        }
    });

    // select 드롭다운 선택값 유지
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = lang;
    }
}

/**
 * 언어 변경 메인 함수 (lang-select onchange 이벤트)
 */
function setLanguage(lang) {
    if (typeof TRANSLATIONS === 'undefined' || !TRANSLATIONS[lang]) return;
    
    window.currentLang = lang;
    localStorage.setItem('preferred_lang', lang);

    // 1. DOM 정적 요소 번역
    applyTranslations();

    // 2. 모드 설명 박스 갱신
    if (typeof updateModeUI === 'function') {
        updateModeUI();
    }

    // 3. 게임 기록 테이블(모드명 포함) 동적 재로딩
    if (typeof renderUserStatsTable === 'function') {
        renderUserStatsTable();
    } else if (typeof renderStatsTable === 'function') {
        renderStatsTable();
    }

    // 4. 게임 영역 동적 UI 텍스트 갱신
    updateGameCardLanguage();

    // 5. 광고 노출 제어
    if (typeof updateAdVisibility === 'function') {
        updateAdVisibility(lang);
    }
}

/**
 * game-card 영역 및 퀴즈 관련 동적 텍스트 언어 재설정
 */
function updateGameCardLanguage() {
    // 힌트 갱신
    const hintElem = document.getElementById('easy-hint');
    if (hintElem && typeof winningTiles !== 'undefined' && winningTiles) {
        hintElem.innerText = t('hintEasy', { count: winningTiles.length });
    }

    // 연승 횟수 갱신
    const streakElem = document.getElementById('streak-display');
    if (streakElem && typeof streakCount !== 'undefined') {
        streakElem.innerText = t('streakCount', { count: streakCount });
    }

    // 문제 지시어 갱신
    const quizInstElem = document.getElementById('quiz-instruction');
    if (quizInstElem && typeof currentMode !== 'undefined') {
        if (currentMode === 'best') {
            quizInstElem.innerHTML = t('quizInstruction.best');
        } else if (currentMode === 'discard') {
            quizInstElem.innerHTML = t('quizInstruction.discard');
        } else {
            quizInstElem.innerHTML = t('quizInstruction.default');
        }
    }
}

// 초기 언어 전역 설정 (로컬스토리지 복원)
window.currentLang = localStorage.getItem('preferred_lang') || 'ko';


// 언어 데이터 맵 (선택 시 UI 동적 반영용)
const LANG_DATA = {
    'ko': { label: '한국어', flags: ['flag/Flag_of_South_Korea.svg'] },
    'ja': { label: '日本語', flags: ['flag/Flag_of_Japan.svg'] },
    'zh_CN': { label: '简体中文', flags: ['flag/Flag_of_the_Peoples_Republic_of_China.svg'] },
    'zh_TW': { label: '繁體中文', flags: ['flag/Flag_of_the_Republic_of_China.svg'] },
    'en': { label: 'English', flags: ['flag/Flag_of_the_United_Kingdom.svg', 'flag/Flag_of_the_United_States.svg'] }
};

// 드롭다운 토글
function toggleLangDropdown() {
    const options = document.getElementById('lang-options');
    if (options) {
        options.classList.toggle('open');
    }
}

// 언어 선택 처리
function selectLanguage(langCode) {
    updateSelectedLangUI(langCode);
    
    // 드롭다운 닫기
    const options = document.getElementById('lang-options');
    if (options) {
        options.classList.remove('open');
    }

    // 기존 언어 적용 함수 호출
    if (typeof setLanguage === 'function') {
        setLanguage(langCode);
    }
}

// 선택된 언어 헤더 UI 업데이트
function updateSelectedLangUI(langCode) {
    const langInfo = LANG_DATA[langCode] || LANG_DATA['ko'];
    const container = document.getElementById('selected-lang');
    if (!container) return;

    let flagHTML = '';
    if (langInfo.flags.length === 1) {
        flagHTML = `<img src="${langInfo.flags[0]}" class="flag-img" alt="${langCode}">`;
    } else {
        flagHTML = `<div class="flag-group">` + 
            langInfo.flags.map(f => `<img src="${f}" class="flag-img">`).join('') + 
            `</div>`;
    }

    container.innerHTML = `${flagHTML} ${langInfo.label}`;
}

// 외부 영역 클릭 시 드롭다운 닫기
window.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.custom-select-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById('lang-options')?.classList.remove('open');
    }
});
