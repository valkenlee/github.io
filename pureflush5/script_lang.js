
function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    window.currentLang = lang;
    localStorage.setItem('app_lang', lang);
    applyTranslations();
    updateAdVisibility(lang);
    if (typeof updateModeUI === 'function') updateModeUI();
}

function t(key, params = {}) {
    const getNestedValue = (obj, path) => {
        if (!obj || !path) return undefined;

        const keys = String(path).split('.');
        let current = obj;

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return undefined;
            }
        }
        return current;
    };

    // 현재 언어에서 찾기 -> 없으면 한국어(ko)에서 찾기
    let text = getNestedValue(TRANSLATIONS[window.currentLang], key) ||
               getNestedValue(TRANSLATIONS['ko'], key);

    // 찾지 못했거나 결과가 문자열이 아닌 경우(객체 그대로 반환 방지)
    if (typeof text !== 'string') {
        console.warn(`[i18n] 번역 키를 찾을 수 없습니다: "${key}"`);
        return key;
    }

    // {count} 등 파라미터 치환
    Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });

    return text;
}

function applyTranslations() {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = window.currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
