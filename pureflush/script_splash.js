// script_splash.js

// 스플래시 화면을 숨기는 공통 함수
function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');

  if (splash && !splash.classList.contains('hide')) {
      splash.classList.add('hide');
  }
}

// 1. 클릭(또는 모바일 터치) 시 즉시 숨김
document.addEventListener('click', (e) => {
  const splash = document.getElementById('splash-screen');
  // 스플래시 화면이 아직 떠있는 상태에서 클릭 시
  if (splash && splash.contains(e.target)) {
    hideSplashScreen();
  }
});

// 2. 클릭하지 않더라도 1초 후 자동으로 숨김
setTimeout(() => {
  hideSplashScreen();
}, 1000);
