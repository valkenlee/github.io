// include.js

// 개별 컴포넌트를 비동기로 로드하는 함수
async function includeHTML(targetId, filePath) {
  const element = document.getElementById(targetId);
  if (!element) return;

  try {
    const response = await fetch(filePath);
    if (response.ok) {
      element.innerHTML = await response.text();
	  
      // 헤더 컴포넌트 로드가 완료되면 테마 버튼 이벤트를 재연결
      if (targetId === 'header-container' && typeof initThemeToggle === 'function') {
        initThemeToggle();
      }	  
    } else {
      element.innerHTML = 'Page not found.';
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
  }
}

// DOM 생성이 완료되면 [data-include] 속성을 가진 요소들을 찾아 자동 실행
document.addEventListener("DOMContentLoaded", function () {
  const includeElements = document.querySelectorAll("[data-include]");
  
  includeElements.forEach((el) => {
    let filePath = el.getAttribute("data-include");
    if (filePath && el.id) {
      // 경로가 '/'로 시작하지 않으면 앞에 '/'를 붙여 도메인 루트 기준 절대 경로로 보정
      if (!filePath.startsWith('/')) {
        filePath = '/' + filePath;
      }
      includeHTML(el.id, filePath);
    }
  });
});
