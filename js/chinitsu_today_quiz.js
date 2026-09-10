import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyBDr45rfTSHy4bWdzUpE8JGlPAQ6Zfgo2Q",
  authDomain: "pureflush.firebaseapp.com",
  projectId: "pureflush",
  storageBucket: "pureflush.firebasestorage.app",
  messagingSenderId: "210471061136",
  appId: "1:210471061136:web:01e1b0a336d695a6987a15",
  measurementId: "G-BRPW73F5L3"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentQuiz = null;
let currentQuizKey = ""; 
let currentDateStr = ""; // YYYYMMDD
let selectedTiles = new Set(); 

// 스팸 방지용 산수 변수
let num1 = Math.floor(Math.random() * 8) + 1;
let num2 = Math.floor(Math.random() * 8) + 1;
let captchaSum = num1 + num2;

function seededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await initDailyQuiz();
  initCaptcha();
  restoreSavedNickname(); // 저장된 닉네임 자동 불러오기
  setupTileSelectors();
  checkAlreadySubmitted();

  const btnSubmitAnswer = document.getElementById('btn-submit-answer');
  if (btnSubmitAnswer) {
    btnSubmitAnswer.addEventListener('click', handleAnswerSubmission);
  }

  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }
});

function generate14TileHand(rng) {
  while (true) {
    const counts = Array(10).fill(0);
    const head = Math.floor(rng() * 9) + 1;
    counts[head] += 2;

    for (let i = 0; i < 4; i++) {
      const isAnko = rng() < 0.3;
      if (isAnko) {
        const tile = Math.floor(rng() * 9) + 1;
        counts[tile] += 3;
      } else {
        const start = Math.floor(rng() * 7) + 1;
        counts[start] += 1;
        counts[start + 1] += 1;
        counts[start + 2] += 1;
      }
    }

    if (counts.every(cnt => cnt <= 4)) {
      const hand14 = [];
      for (let t = 1; t <= 9; t++) {
        for (let c = 0; c < counts[t]; c++) {
          hand14.push(t);
        }
      }
      return hand14;
    }
  }
}

function isCompleteHand(hand14) {
  const counts = Array(10).fill(0);
  hand14.forEach(t => counts[t]++);

  for (let head = 1; head <= 9; head++) {
    if (counts[head] >= 2) {
      counts[head] -= 2;
      if (canFormMelds(counts)) return true;
      counts[head] += 2;
    }
  }
  return false;
}

function canFormMelds(counts) {
  const c = [...counts];
  for (let i = 1; i <= 9; i++) {
    while (c[i] > 0) {
      if (c[i] >= 3) {
        c[i] -= 3;
      } else if (i <= 7 && c[i + 1] > 0 && c[i + 2] > 0) {
        c[i]--;
        c[i + 1]--;
        c[i + 2]--;
      } else {
        return false;
      }
    }
  }
  return true;
}

function getWaitArray(hand13) {
  const waits = [];
  const counts = Array(10).fill(0);
  hand13.forEach(t => counts[t]++);

  for (let tile = 1; tile <= 9; tile++) {
    if (counts[tile] < 4) {
      const testHand = [...hand13, tile].sort((a, b) => a - b);
      if (isCompleteHand(testHand)) {
        waits.push(tile);
      }
    }
  }
  return waits;
}

function generateDailyTenpaiQuiz(seedNumber) {
  const rng = seededRandom(seedNumber);

  while (true) {
    const hand14 = generate14TileHand(rng);
    const removeIdx = Math.floor(rng() * 14);
    const hand13 = [...hand14];
    hand13.splice(removeIdx, 1);
    hand13.sort((a, b) => a - b);

    const waitArray = getWaitArray(hand13);

    if (waitArray.length > 0) {
        return {
          tiles: hand13,
          waitArray: waitArray,
          waitText: `${waitArray.join(', ')}만 (${waitArray.length}면대기)`,
          explanation: `오늘의 알고리즘 계산 오름패는 총 ${waitArray.length}개 [ ${waitArray.map(v => v + '만').join(', ')} ] 입니다.`,
          novelTitle: "📖 제미나이의 문학 작품",
          novelContent: "오늘의 작품을 준비 중입니다." // 문구 변경[cite: 4]
        };
    }
  }
}

// chinitsu_today_quiz.js

function getAdjustedDateKey() {
  const now = new Date();
  const adjusted = new Date(now);
  if (now.getHours() < 6) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const day = String(adjusted.getDate()).padStart(2, '0');
  
  return {
    dateKey: `${year}${month}${day}`,         // 20260909
    isoDate: `${year}-${month}-${day}`,       // 2026-09-09 (Firestore Document ID 호환용)
    formatted: `${year}년 ${month}월 ${day}일`
  };
}

async function initDailyQuiz() {
  const { dateKey, isoDate, formatted } = getAdjustedDateKey();
  currentDateStr = dateKey;
  currentQuizKey = `quiz_${currentDateStr}`;

  const dateDisplay = document.getElementById('quiz-date-display');
  if (dateDisplay) {
    dateDisplay.innerText = `${formatted} 문제 (06:00 갱신)`;
  }

  // 1. Firebase daily_quiz_archives 에서 당일 데이터 가져오기 시도
  try {
    // "2026-09-09" 문서 ID로 먼저 조회
    let docRef = doc(db, "daily_quiz_archives", isoDate);
    let docSnap = await getDoc(docRef);

    // 하이픈 없는 "20260909" 문서 ID로 이차 조회
    if (!docSnap.exists()) {
      docRef = doc(db, "daily_quiz_archives", currentDateStr);
      docSnap = await getDoc(docRef);
    }

	if (docSnap.exists()) {
	  const data = docSnap.data();

	  // geminiWork가 객체인지 문자열인지 안전하게 파싱
	  let extractedTitle = data.novel_title || data.novelTitle;
	  let extractedContent = data.novel_content || data.novelContent;

	  if (!extractedTitle && data.geminiWork) {
		extractedTitle = typeof data.geminiWork === 'object' ? data.geminiWork.title : "📖 제미나이의 문학 작품";
	  }
	  if (!extractedContent && data.geminiWork) {
		extractedContent = typeof data.geminiWork === 'object' ? data.geminiWork.content : data.geminiWork;
	  }

	  currentQuiz = {
		tiles: data.tiles,
		waitArray: data.waitArray || data.answers,
		waitText: data.waitText || `${(data.waitArray || data.answers).join(', ')}만`,
		explanation: data.explanation || `오늘의 오름패는 [ ${(data.waitArray || data.answers).map(v => v + '만').join(', ')} ] 입니다.`,
		novelTitle: extractedTitle || "📖 제미나이의 문학 작품",
		novelContent: extractedContent || "오늘의 작품을 준비 중입니다."
	  };
	} else {
      // date 필드가 "2026-09-09" 형식으로 들어있는 경우 쿼리 검색
      const q = query(collection(db, "daily_quiz_archives"), where("date", "==", isoDate), limit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data();
        currentQuiz = {
          tiles: data.tiles,
          waitArray: data.waitArray || data.answers,
          waitText: data.waitText || `${(data.waitArray || data.answers).join(', ')}만`,
          explanation: data.explanation || `오늘의 오름패는 [ ${(data.waitArray || data.answers).map(v => v + '만').join(', ')} ] 입니다.`,
          novelTitle: data.novel_title || data.novelTitle || (data.geminiWork ? data.geminiWork.title : null) || "📖 제미나이의 문학 작품",
          novelContent: data.novel_content || data.novelContent || data.geminiWork || (data.geminiWork ? data.geminiWork.content : null) || "오늘의 작품을 준비 중입니다."
        };
      }
    }
  } catch (error) {
    console.warn("Firestore 퀴즈 연동 실패, 클라이언트 생성기로 전환합니다:", error);
  }

  // 2. Firebase에 데이터가 없을 경우 기존 Seed 알고리즘을 통한 폴백
  if (!currentQuiz) {
    const seedNumber = parseInt(currentDateStr, 10);
    currentQuiz = generateDailyTenpaiQuiz(seedNumber);
  }


    // UI 렌더링 - 손패 이미지
      const handContainer = document.getElementById('daily-mahjong-hand');
      const handRepeatContainer = document.getElementById('daily-mahjong-hand-repeat'); // 신규 추가

      if (handContainer || handRepeatContainer) {
        if (handContainer) handContainer.innerHTML = '';
        if (handRepeatContainer) handRepeatContainer.innerHTML = ''; // 초기화
        
        // 접두어 맵핑 테이블
        const prefixMap = {
          m: 'Man',
          p: 'Pin',
          s: 'Sou',
          z: 'Ji' // 필요 시 자패(z) 대응용
        };

        currentQuiz.tiles.forEach(tile => {
          let fileName = "";
          const tileStr = String(tile).trim();

          // 1. "1m", "1p", "1s" 형태 매칭 (숫자 + m/p/s/z)
          const shortMatch = tileStr.match(/^([1-9])([mpsz])$/i);

          // 2. 이미 "Man1", "Pin1" 형태인지 매칭 (Man/Pin/Sou/Ji + 숫자)
          const fullNameMatch = tileStr.match(/^(Man|Pin|Sou|Ji)([1-9])$/i);

          if (shortMatch) {
            const num = shortMatch[1];
            const suit = shortMatch[2].toLowerCase();
            const prefix = prefixMap[suit] || suit.toUpperCase();
            fileName = `${prefix}${num}`;
          } else if (fullNameMatch) {
            // 이미 Man1, Pin1 형태인 경우 대소문자 정규화 후 유지
            const prefix = fullNameMatch[1].charAt(0).toUpperCase() + fullNameMatch[1].slice(1).toLowerCase();
            const num = fullNameMatch[2];
            fileName = `${prefix}${num}`;
          } else if (!isNaN(tile)) {
            // 숫자만 넘어오는 경우(예: 1) 기본 만수(Man) 처리
            fileName = `Man${tile}`;
          } else {
            fileName = tileStr;
          }

          if (fileName) {
            // 상단 손패 이미지 생성
            if (handContainer) {
              const img = document.createElement('img');
              img.src = `tile/${fileName}.svg`;
              img.alt = tileStr;
              img.className = 'tile';
              handContainer.appendChild(img);
            }

            // [신규] 하단 재노출 손패 이미지 생성
            if (handRepeatContainer) {
              const imgRepeat = document.createElement('img');
              imgRepeat.src = `tile/${fileName}.svg`;
              imgRepeat.alt = tileStr;
              imgRepeat.className = 'tile';
              handRepeatContainer.appendChild(imgRepeat);
            }
          }
        });
      }

  // 정답 및 해설 세팅
  const answerTiles = document.getElementById('answer-tiles-text');
  const answerExp = document.getElementById('answer-explanation');
  if (answerTiles) answerTiles.innerText = currentQuiz.waitText;
  if (answerExp) answerExp.innerText = currentQuiz.explanation;

  // 제미나이 문학 작품 세팅
  const novelTitleEl = document.getElementById('novel-title');
  const novelContentEl = document.getElementById('novel-content');
  if (novelTitleEl && currentQuiz.novelTitle) novelTitleEl.innerText = currentQuiz.novelTitle;
  if (novelContentEl && currentQuiz.novelContent) novelContentEl.innerText = currentQuiz.novelContent;
}

function checkAlreadySubmitted() {
  const submittedData = localStorage.getItem(currentQuizKey);
  if (submittedData) {
    const savedResult = JSON.parse(submittedData);
    disableSubmissionUI(savedResult.isCorrect, savedResult.userChoice);
  }
}

function disableSubmissionUI(isCorrect, userChoice) {
  const resultBox = document.getElementById('submission-result-box');
  if (resultBox) {
    resultBox.style.display = 'block';

    if (isCorrect) {
      resultBox.className = "submission-result-box correct";
      resultBox.innerHTML = `<strong>🎉 정답을 맞추셨습니다!</strong><br>선택하신 답: [ ${userChoice.map(v => v + '만').join(', ')} ]<br>(오늘의 문제는 제출이 완료되었습니다. 내일 오전 6시에 새 문제가 출제됩니다.)`;
    } else {
      resultBox.className = "submission-result-box wrong";
      resultBox.innerHTML = `<strong>❌ 제출이 완료되었습니다.</strong><br>제출하셨던 답: [ ${userChoice.map(v => v + '만').join(', ')} ]<br>아래 정답과 해설을 확인해 보세요.`;
    }
  }

  document.querySelectorAll('.btn-tile-select').forEach(b => b.disabled = true);
  const submitBtn = document.getElementById('btn-submit-answer');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "오늘 제출 완료됨";
  }

  const quizAnswerBox = document.getElementById('quiz-answer-box');
  if (quizAnswerBox) quizAnswerBox.style.display = 'block';

  const answerContent = document.getElementById('answer-content');
  if (answerContent) answerContent.style.display = 'block';

  // 제미나이 문학 작품 영역 노출
  const geminiNovelCard = document.getElementById('gemini-novel-card');
  if (geminiNovelCard) geminiNovelCard.style.display = 'block';

  // 한줄 소통 게시판 노출
  const boardSection = document.getElementById('board-section');
  if (boardSection) boardSection.style.display = 'block';

  subscribeFirebaseComments();
}

function setupTileSelectors() {
  const buttons = document.querySelectorAll('.btn-tile-select');
  const submitBtn = document.getElementById('btn-submit-answer');
  const summaryDisplay = document.getElementById('selected-tiles-display');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (localStorage.getItem(currentQuizKey)) return;

      const val = parseInt(btn.getAttribute('data-val'), 10);

      if (selectedTiles.has(val)) {
        selectedTiles.delete(val);
        btn.classList.remove('selected');
      } else {
        selectedTiles.add(val);
        btn.classList.add('selected');
      }

      const sortedSelected = Array.from(selectedTiles).sort((a, b) => a - b);

      if (sortedSelected.length > 0) {
        if (summaryDisplay) summaryDisplay.innerText = sortedSelected.map(v => `${v}만`).join(', ');
        if (submitBtn) submitBtn.disabled = false;
      } else {
        if (summaryDisplay) summaryDisplay.innerText = "선택 없음";
        if (submitBtn) submitBtn.disabled = true;
      }
    });
  });
}

function handleAnswerSubmission() {
  if (selectedTiles.size === 0 || localStorage.getItem(currentQuizKey)) return;

  const userChoice = Array.from(selectedTiles).sort((a, b) => a - b);
  const targetAnswer = currentQuiz.waitArray.sort((a, b) => a - b);

  const isCorrect = userChoice.length === targetAnswer.length &&
    userChoice.every((val, index) => val === targetAnswer[index]);

  localStorage.setItem(currentQuizKey, JSON.stringify({
    isCorrect: isCorrect,
    userChoice: userChoice,
    submittedAt: new Date().toISOString()
  }));

  disableSubmissionUI(isCorrect, userChoice);
}

function initCaptcha() {
  const input = document.getElementById('captcha-answer');
  if (input) {
    input.placeholder = `보안확인: ${num1} + ${num2} = ?`;
  }
}

function restoreSavedNickname() {
  const savedNickname = localStorage.getItem("saved_comment_nickname");
  const nicknameInput = document.getElementById('nickname');
  if (savedNickname && nicknameInput) {
    nicknameInput.value = savedNickname;
  }
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  
  const nicknameInput = document.getElementById('nickname');
  const captchaInput = document.getElementById('captcha-answer');
  const bodyInput = document.getElementById('comment-body');
  const submitBtn = document.getElementById('btn-submit');

  const nickname = nicknameInput.value.trim();
  const userCaptcha = parseInt(captchaInput.value.trim(), 10);
  const commentBody = bodyInput.value.trim();

  if (userCaptcha !== captchaSum) {
    alert("스팸 방지 산수 정답이 올바르지 않습니다.");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = "등록 중...";

    await addDoc(collection(db, "daily_quiz_comments"), {
      nickname: nickname || "익명",
      text: commentBody,
      createdAt: serverTimestamp()
    });

    if (nickname) {
      localStorage.setItem("saved_comment_nickname", nickname);
    }

    bodyInput.value = "";
    captchaInput.value = "";

    num1 = Math.floor(Math.random() * 8) + 1;
    num2 = Math.floor(Math.random() * 8) + 1;
    captchaSum = num1 + num2;
    initCaptcha();

  } catch (error) {
    console.error("댓글 등록 오류:", error);
    alert("댓글 등록에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "등록하기";
  }
}

function subscribeFirebaseComments() {
  const tbody = document.getElementById('comment-list-tbody');
  if (!tbody) return;

  const q = query(
    collection(db, "daily_quiz_comments"),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="2" class="no-comments">첫 번째 풀이 댓글을 남겨보세요!</td></tr>';
      return;
    }

    tbody.innerHTML = snapshot.docs.map(doc => {
      const data = doc.data();
      return `
        <tr>
          <td class="comment-author-td">${escapeHtml(data.nickname)}</td>
          <td class="comment-text-td">${escapeHtml(data.text)}</td>
        </tr>
      `;
    }).join('');
  }, (error) => {
    console.error("Firebase 동기화 오류:", error);
    tbody.innerHTML = '<tr><td colspan="2" class="no-comments">댓글을 불러오는 중입니다...</td></tr>';
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
