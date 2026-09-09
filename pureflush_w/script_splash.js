// script_splash.js

function initSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  const splashImg = splash.querySelector('img');

  // 스플래시 화면을 숨기는 공통 함수[cite: 15]
  function hideSplashScreen() {
    if (splash && !splash.classList.contains('hide')) {
      splash.classList.add('hide');[cite: 15]
    }
  }

  // 화면 크기를 읽어 더 작은 축 크기로 이미지 적용
  function resizeSplashImage() {
    const minSize = Math.min(window.innerWidth, window.innerHeight);
    splashImg.style.width = `${minSize}px`;
    splashImg.style.height = `${minSize}px`;
  }

  // 이미지가 준비되면 실행
  function onImageReady() {
    resizeSplashImage(); // 크기 맞춤 연산
    splash.classList.add('active'); // 화면에 표시

    // 0.8초 후 자동으로 숨김[cite: 15]
    setTimeout(() => {
      hideSplashScreen();
    }, 800);
  }

  // 이미지가 이미 캐시되어 로드 완료된 경우
  if (splashImg.complete && splashImg.naturalWidth !== 0) {
    onImageReady();
  } else {
    splashImg.onload = onImageReady;
    splashImg.onerror = hideSplashScreen; // 에러 발생 시 진행 차단 방지
  }

  // 화면 크기가 리사이즈될 때 동적 대응
  window.addEventListener('resize', resizeSplashImage);

  // 클릭/터치 시 즉시 숨김[cite: 15]
  splash.addEventListener('click', () => {
    hideSplashScreen();
  });
}

// DOM 로드 완료 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSplashScreen);
} else {
  initSplashScreen();
}