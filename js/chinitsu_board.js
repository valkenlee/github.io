
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// Firebase 프로젝트 설정 (Firebase 콘솔에서 생성 후 대입)  
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



const PAGE_SIZE = 20; // 페이지당 출력 건수
let allPosts = [];
let currentPage = 1;

// 스팸 방지용 산수 변수
let num1 = Math.floor(Math.random() * 8) + 1;
let num2 = Math.floor(Math.random() * 8) + 1;
let captchaSum = num1 + num2;

document.addEventListener("DOMContentLoaded", () => {
  restoreSavedNickname();	
  initCaptcha();
  loadPosts();

  const writeForm = document.getElementById("board-write-form");
  if (writeForm) {
    writeForm.addEventListener("submit", handlePostSubmit);
  }

  const btnPrev = document.getElementById("btn-prev");
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    });
  }

  const btnNext = document.getElementById("btn-next");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const maxPage = Math.ceil(allPosts.length / PAGE_SIZE) || 1;
      if (currentPage < maxPage) {
        currentPage++;
        renderPage();
      }
    });
  }
});

function initCaptcha() {
  const input = document.getElementById("captcha-answer");
  if (input) {
    input.placeholder = `보안확인: ${num1} + ${num2} = ?`;
  }
}

// 전체 게시글 조회 (오류 방지 안전 코드)
async function loadPosts() {
  const tbody = document.getElementById("board-tbody");
  try {
    // 쿼리 단순화 (Firestore orderBy 예외 방지)
    const q = query(collection(db, "daily_quiz_comments"));
    const snapshot = await getDocs(q);

    allPosts = snapshot.docs.map(doc => {
      const data = doc.data();
      // createdAt 필드가 비어있거나 null일 경우를 대비한 안전 처리
      const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();
      
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const timeStr = `${month}.${day}. ${hours}:${minutes}`;

      return {
        id: doc.id,
        nickname: data.nickname || "익명",
        text: data.text || "",
        rawTime: dateObj.getTime(), // 정렬용 타임스탬프
        timeStr: timeStr
      };
    });

    // 클라이언트 측 최신순 정렬 (서버 측 인덱스 오류 완벽 회피)
    allPosts.sort((a, b) => b.rawTime - a.rawTime);

    currentPage = 1;
    renderPage();

  } catch (error) {
    console.error("게시글 불러오기 오류:", error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="3" class="no-data">게시글을 불러오는데 실패했습니다. (콘솔 오류 확인 필요)</td></tr>';
    }
  }
}

// 현재 페이지 데이터 및 네비게이션 렌더링
function renderPage() {
  const tbody = document.getElementById("board-tbody");
  if (!tbody) return;

  if (allPosts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="no-data">등록된 게시글이 없습니다. 첫 글을 작성해 보세요!</td></tr>';
    renderPagination(1);
    return;
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = allPosts.slice(startIndex, startIndex + PAGE_SIZE);

  tbody.innerHTML = pageItems.map(item => `
    <tr>
      <td class="author-td">${escapeHtml(item.nickname)}</td>
      <td class="text-td">${escapeHtml(item.text)}</td>
      <td class="time-td">${item.timeStr}</td>
    </tr>
  `).join('');

  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE) || 1;
  renderPagination(totalPages);
}

// 페이지 네비게이션 버튼 렌더링
function renderPagination(totalPages) {
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const pageNumbersContainer = document.getElementById("page-numbers");

  if (btnPrev) btnPrev.disabled = (currentPage === 1);
  if (btnNext) btnNext.disabled = (currentPage === totalPages);

  if (!pageNumbersContainer) return;
  pageNumbersContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.type = "button";
    pageBtn.className = `btn-page-num ${i === currentPage ? 'active' : ''}`;
    pageBtn.innerText = i;
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderPage();
    });
    pageNumbersContainer.appendChild(pageBtn);
  }
}

// 새 게시글 등록
async function handlePostSubmit(event) {
  event.preventDefault();

  const nicknameInput = document.getElementById("nickname");
  const captchaInput = document.getElementById("captcha-answer");
  const bodyInput = document.getElementById("comment-body");
  const submitBtn = document.getElementById("btn-submit");

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

    document.getElementById("board-write-form").reset();
    num1 = Math.floor(Math.random() * 8) + 1;
    num2 = Math.floor(Math.random() * 8) + 1;
    captchaSum = num1 + num2;
    initCaptcha();

	// 댓글 등록 성공 블록 내부
	if (nickname) {
	  localStorage.setItem("saved_comment_nickname", nickname);
    }

    // 작성 완료 후 데이터를 다시 불러와 최신글 1페이지 표시
    await loadPosts();

  } catch (error) {
    console.error("게시글 등록 오류:", error);
    alert("게시글 등록에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "등록하기";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function restoreSavedNickname() {
  const savedNickname = localStorage.getItem("saved_comment_nickname");
  const nicknameInput = document.getElementById('nickname');
  if (savedNickname && nicknameInput) {
    nicknameInput.value = savedNickname;
  }
}

