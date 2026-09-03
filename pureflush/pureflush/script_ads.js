
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
  
  // 한국어가 아닌 경우에만 광고 표시
  if (selectedLang !== 'ko' && selectedLang !== 'ko_KR') {
    ad1Container.style.display = 'block';
    ad2Container.style.display = 'block';     
  } else {
    ad1Container.style.display = 'none';
    ad2Container.style.display = 'none';     
  }
}

