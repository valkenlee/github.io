/**
 * 최고의 오름패 (Best Winning Tile) 모드 확장 및 인터페이스 연동 스크립트
 */

// 1. 최고 판수 분석 텍스트 생성 및 UI 강조 처리 함수
function renderBestPanAnalysisHTML(suitNum, handArr, userSelectedTile, reach = 1, winCard = 1) {
  if (typeof check_best_pan !== 'function') {
    console.error('check_best_pan 함수를 찾을 수 없습니다.');
    return { html: '', isUserCorrect: false, bestTiles: [], maxScore: 0 };
  }

  const resultData = check_best_pan(suitNum, handArr, userSelectedTile, reach, winCard);
  const bestTiles = resultData.bestTiles || [];
  const maxScore = resultData.maxScore || 0;

  // 번역 함수 래퍼 (t 함수가 없을 경우 기본값 대응)
  const tr = typeof t === 'function' ? t : (k) => k;

  let html = `<div class="explanation-box" style="margin-top:15px; text-align:left;">`;
  html += `<h4>📊 ${tr('bestReportHeaderTitle', '1~9 오름패 판수 상세 분석 리포트')}</h4>`;
  html += `<p style="font-size:13px; color:#555; margin-bottom:10px;">${tr('bestReportCondition', '(조건: 리치 1판 + 멘젠쯔모 1판 기본 적용)')}</p>`;
  html += `<ul style="list-style:none; padding:0; margin:0; font-family:monospace, monospace; font-size:14px; line-height:1.8;">`;

  if (resultData.analysis && Array.isArray(resultData.analysis)) {
    resultData.analysis.forEach((item) => {
      const isBest = bestTiles.includes(item.tile) && maxScore > 0;
      const isValid = item.isValid;

      if (isBest) {
        // 🏆 1. 최고 정답 패 강조 (배경 초록색 계열 + 진한 텍스트 + 테두리)
        html += `<li class="report-item best" style="font-weight:bold; color:#1e8449; background-color:#e8f8f5; padding:6px 10px; border-radius:4px; margin-bottom:4px; border:1px solid #2ecc71;">`;
        html += `🏆 <b>${item.tile}</b> : ${item.text} <b>${tr('bestReportOptimalChoice', '[최적의 선택]')}</b>`;
        html += `</li>`;
      } else if (isValid) {
        // ⭕ 2. 일반 청일색 화료 가능 패 (배경 파란색 계열 + 유효 강조)
        html += `<li class="report-item valid" style="font-weight:bold; color:#2980b9; background-color:#ebf5fb; padding:4px 8px; border-radius:4px; margin-bottom:4px; border-left:4px solid #3498db;">`;
        html += `⭕ <b>${item.tile}</b> : ${item.text}`;
        html += `</li>`;
      } else {
        // ❌ 3. 화료 불가 패 (역 미성립 또는 4장 존재 - 흐린 회색 + 취소선)
        html += `<li class="report-item invalid" style="color:#a6acaf; background-color:#f4f6f7; padding:4px 8px; border-radius:4px; margin-bottom:4px; text-decoration:line-through;">`;
        html += `❌ <b>${item.tile}</b> : ${item.text}`;
        html += `</li>`;
      }
    });
  }

  html += `</ul></div>`;
  return { html, isUserCorrect: resultData.isUserBestChoice, bestTiles, maxScore };
}

// 2. "최고의 오름패" 모드 제출 및 결과 처리
function handleBestModeSubmit() {
  const resultDiv = document.getElementById('result');
  const btnSubmit = document.getElementById('btn-submit');
  const tr = typeof t === 'function' ? t : (k, defaultVal) => defaultVal || k;


  if (!isSubmitted) {
    if (!selectedTiles || selectedTiles.size === 0) {
      if (resultDiv) {
         resultDiv.className = 'result-message incorrect';
	 resultDiv.innerHTML = `⚠️ <b>${tr('alertSelectTile', '오름패를 최소 1개 이상 선택해 주세요.')}</b>`;
         resultDiv.style.display = 'block';
      }
      return;
    }

    isSubmitted = true;
    
    // 사용자가 선택한 첫번째 패
    const userChoice = Array.from(selectedTiles)[0];
    const suitNum = currentSuitObj.code === 'Man' ? 1 : (currentSuitObj.code === 'Pin' ? 2 : 3);
    
    // 리치(1), 멘젠쯔모(1) 조건으로 판수 분석
    const { html, isUserCorrect, bestTiles, maxScore } = renderBestPanAnalysisHTML(
      suitNum,
      currentHand,
      userChoice,
      1,
      1
    );

    resultDiv.style.display = 'block';
    
    const displayScore = maxScore >= 13 ? tr('bestReport.yakuman', '역만') : tr('bestReport.han', { count: maxScore });

    if (isUserCorrect) {
      resultDiv.className = 'result-message correct';
      resultDiv.innerHTML = `🎉 <b>${tr('correct', '정답입니다!')}</b><br>${tr('bestResultCorrectMsg', { tile: userChoice, score: displayScore })}${html}`;
    } else {
      resultDiv.className = 'result-message incorrect';
      resultDiv.innerHTML = `❌ <b>${tr('incorrect', '오답입니다.')}</b><br>${tr('bestResultIncorrectMsg', { tile: userChoice, bestTiles: bestTiles.join(', '), score: displayScore })}${html}`;
    }

    if (btnSubmit) {
      btnSubmit.innerText = tr('btnNextSame', '다음 문제 (동일 난이도)');
    }
  } else {
    // 다음 문제로 이동
    isSubmitted = false;
    if (resultDiv) resultDiv.style.display = 'none';
    if (btnSubmit) btnSubmit.innerText = tr('btnSubmit', '제출');
    if (typeof generateQuiz === 'function') {
      generateQuiz();
    }
  }
}

// 3. 안전한 래핑 및 모드 통합 처리 (Hooking)
(function initScript2Hooks() {
  // 1) Submit 버튼 래핑
  const rawSubmit = window.handleSubmitOrNext;
  window.handleSubmitOrNext = function() {
    if (typeof currentMode !== 'undefined' && currentMode === 'best') {
      handleBestModeSubmit();
    } else if (typeof rawSubmit === 'function') {
      rawSubmit.apply(this, arguments);
    }
  };

  // 2) 퀴즈 생성(generateQuiz) 래핑 - Best 모드일 때 대기패가 존재하는 손패가 보장되도록 처리
  const rawGenerateQuiz = window.generateQuiz;
  window.generateQuiz = function() {
    if (typeof currentMode !== 'undefined' && currentMode === 'best') {
      if (typeof rawGenerateQuiz === 'function') {
        rawGenerateQuiz.apply(this, arguments);
      }
      if (typeof selectedTiles !== 'undefined' && selectedTiles.clear) {
        selectedTiles.clear();
      }
    } else if (typeof rawGenerateQuiz === 'function') {
      rawGenerateQuiz.apply(this, arguments);
    }
  };
})();
