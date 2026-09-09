import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {   getAuth,   GoogleAuthProvider,   signInWithPopup,   signOut,   onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {   getFirestore,   collection,   doc,   getDocs, addDoc,  deleteDoc,  writeBatch, query , orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 관리자로 허용할 구글 계정의 UID 목록
const ALLOWED_ADMIN_UIDS = [
  "esg2QkajqGbuH8zXyqEm1HyqZw92" // 본인의 구글 UID
];

let pageSize = 20;
let allPosts = [];
let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  // 로그인 상태 감지
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (ALLOWED_ADMIN_UIDS.includes(user.uid)) {
        document.getElementById("auth-section")?.classList.add("hidden");
        document.getElementById("admin-main-section")?.classList.remove("hidden");
        const userInfoEl = document.getElementById("user-info");
        if (userInfoEl) userInfoEl.innerText = `${user.displayName} (${user.email})`;
        loadPosts();
      } else {
        alert(`권한이 없는 구글 계정입니다.\nUID: ${user.uid}`);
        signOut(auth);
      }
    } else {
      document.getElementById("auth-section")?.classList.remove("hidden");
      document.getElementById("admin-main-section")?.classList.add("hidden");
    }
  });

  document.getElementById("btn-login")?.addEventListener("click", () => {
    signInWithPopup(auth, provider).catch(error => {
      console.error("로그인 실패:", error);
      alert("구글 로그인에 실패했습니다.");
    });
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    signOut(auth);
  });

  // 페이지당 보기 개수 변경
  document.getElementById("select-page-size")?.addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    renderPage();
  });

  // 전체 선택 / 해제 체크박스
  document.getElementById("chk-all")?.addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    document.querySelectorAll(".chk-post").forEach(chk => {
      chk.checked = isChecked;
    });
  });

  // 선택 일괄 삭제 버튼
  document.getElementById("btn-delete-selected")?.addEventListener("click", deleteSelectedPosts);

  document.getElementById("btn-prev")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  });

  document.getElementById("btn-next")?.addEventListener("click", () => {
    const maxPage = Math.ceil(allPosts.length / pageSize) || 1;
    if (currentPage < maxPage) {
      currentPage++;
      renderPage();
    }
  });
});

async function loadPosts() {
  const tbody = document.getElementById("admin-tbody");
  try {
    const q = query(collection(db, "daily_quiz_comments"));
    const snapshot = await getDocs(q);

    allPosts = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let dateObj = new Date();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        dateObj = data.createdAt.toDate();
      }

      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');

      return {
        id: docSnap.id,
        nickname: data.nickname || "익명",
        text: data.text || "",
        rawTime: dateObj.getTime(),
        timeStr: `${month}.${day}. ${hours}:${minutes}`
      };
    });

    allPosts.sort((a, b) => b.rawTime - a.rawTime);
    const totalCountEl = document.getElementById("total-count");
    if (totalCountEl) totalCountEl.innerText = `(총 ${allPosts.length}개)`;

    currentPage = 1;
    renderPage();

  } catch (error) {
    console.error("데이터 로드 오류:", error);
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="no-data">데이터를 불러오지 못했습니다.</td></tr>';
  }
}

function renderPage() {
  const tbody = document.getElementById("admin-tbody");
  const chkAll = document.getElementById("chk-all");
  
  if (chkAll) chkAll.checked = false; // 페이지 변경 시 전체 선택 해제

  if (!tbody) return;

  if (allPosts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">등록된 게시글이 없습니다.</td></tr>';
    return;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = allPosts.slice(startIndex, startIndex + pageSize);

  tbody.innerHTML = pageItems.map(item => `
    <tr>
      <td class="author-td">${escapeHtml(item.nickname)}</td>
      <td class="text-td">${escapeHtml(item.text)}</td>
      <td class="time-td">${item.timeStr}</td>
      <td style="text-align: center;">
        <input type="checkbox" class="chk-post" value="${item.id}">
      </td>	  
    </tr>
  `).join('');

  // 개별 체크박스 상태에 따른 전체선택 헤더 체크박스 동기화
  tbody.querySelectorAll(".chk-post").forEach(chk => {
    chk.addEventListener("change", () => {
      const allCheckboxes = tbody.querySelectorAll(".chk-post");
      const checkedBoxes = tbody.querySelectorAll(".chk-post:checked");
      if (chkAll) chkAll.checked = (allCheckboxes.length === checkedBoxes.length);
    });
  });

  const totalPages = Math.ceil(allPosts.length / pageSize) || 1;
  renderPagination(totalPages);
}

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

// 선택 일괄 삭제 실행 함수 (writeBatch 적용)
async function deleteSelectedPosts() {
  const checkedBoxes = document.querySelectorAll(".chk-post:checked");
  if (checkedBoxes.length === 0) {
    alert("삭제할 게시글을 선택해 주세요.");
    return;
  }

  if (!confirm(`선택한 ${checkedBoxes.length}개의 게시글을 정말 삭제하시겠습니까?`)) {
    return;
  }

  try {
    const batch = writeBatch(db);
    checkedBoxes.forEach(chk => {
      const docRef = doc(db, "daily_quiz_comments", chk.value);
      batch.delete(docRef);
    });

    await batch.commit();
    alert("선택한 게시글이 성공적으로 일괄 삭제되었습니다.");
    loadPosts();
  } catch (error) {
    console.error("일괄 삭제 실패:", error);
    alert(`삭제 실패\n코드: ${error.code}\n메시지: ${error.message}`);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
