// js/theme.js

// 1. 테마 적용 함수
function applyTheme(theme) {
  const themeIcon = document.querySelector('#themeToggle .theme-icon');
  const themeText = document.querySelector('#themeToggle .theme-text');

  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = '라이트';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = '다크';
  }
}

// 2. 초기 테마 상태 동기화 (페이지 로드 즉시 실행)
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

// DOM 생성 시점 바로 테마 적용 (화면 찌그러짐/깜빡임 방지)
applyTheme(currentTheme);

// 3. 동적으로 삽입된 버튼에 이벤트를 연결하는 함수
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggle');
  if (!themeToggleBtn) return;

  // UI 상태 갱신
  applyTheme(currentTheme);

  // 기존 이벤트 중복 등록 방지 후 클릭 이벤트 추가
  themeToggleBtn.onclick = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
  };
}

// 일반 페이지 로드 시에도 실행
document.addEventListener('DOMContentLoaded', initThemeToggle);