function initAppLanguage() {
    // 1. 번역 적용 및 <select id="lang-select"> UI를 currentLang 값으로 맞춤
    applyTranslations();

    // 2. 동기화된 currentLang 변수를 기준으로 광고 출력 여부 판단
    updateAdVisibility(window.currentLang);
}

// DOM 상태를 체크하여 이미 파싱이 끝났다면 즉시 실행, 아니라면 이벤트 등록
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppLanguage);
} else {
    // DOM이 이미 준비된 경우 즉시 실행
    initAppLanguage();
}

function updateAdVisibility(selectedLang) {
  const ad1Container = document.querySelector('.area_ad1');
  const ad2Container = document.querySelector('.area_ad2');   
  
  if (!ad1Container || !ad2Container) return;

  // 한국어가 아닌 경우에만 광고 표시 ('ko', 'ko_KR', 'ko-KR' 모두 대응)
  if (selectedLang !== 'ko' && selectedLang !== 'ko_KR' && selectedLang !== 'ko-KR') {
    ad1Container.style.setProperty('display', 'block', 'important');
    ad2Container.style.setProperty('display', 'flex', 'important');     
  } else {
    ad1Container.style.setProperty('display', 'none', 'important');
    ad2Container.style.setProperty('display', 'none', 'important');     
  }
}

