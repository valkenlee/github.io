import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } 
  from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBDr45rfTSHy4bWdzUpE8JGlPAQ6Zfgo2Q",
  authDomain: "pureflush.firebaseapp.com",
  projectId: "pureflush",
  storageBucket: "pureflush.firebasestorage.app",
  messagingSenderId: "210471061136",
  appId: "1:210471061136:web:01e1b0a336d695a6987a15",
  measurementId: "G-BRPW73F5L3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let archivesData = [];

// 오전 6시 기준 오늘 날짜 계산 함수
function getAdjustedTodayKey() {
  const now = new Date();
  const adjusted = new Date(now);
  if (now.getHours() < 6) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const day = String(adjusted.getDate()).padStart(2, '0');

  return {
    dateKey: `${year}${month}${day}`,
    isoDate: `${year}-${month}-${day}`
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadQuizHistory();
  setupModalEvents();
});

async function loadQuizHistory() {
  const tbody = document.getElementById("history-list-tbody");
  if (!tbody) return;

  try {
    const q = query(
      collection(db, "daily_quiz_archives"),
      orderBy("date", "desc"),
      limit(100)
    );

    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      tbody.innerHTML = '<tr><td colspan="2" class="no-history">등록된 과거 퀴즈가 없습니다.</td></tr>';
      return;
    }

    const { dateKey: todayKey } = getAdjustedTodayKey();

    archivesData = [];
    querySnap.forEach((docSnap) => {
      const data = docSnap.data();
      data.id = docSnap.id;

      const docDateRaw = data.date || data.id || "";
      const docDateFormatted = docDateRaw.replace(/-/g, "");

      if (docDateFormatted < todayKey) {
        archivesData.push(data);
      }
    });

    if (archivesData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="no-history">과거 퀴즈 기록이 아직 없습니다.</td></tr>';
      return;
    }

    renderHistoryList(archivesData);

  } catch (error) {
    console.error("아카이브 데이터를 불러오는 중 오류 발생:", error);
    tbody.innerHTML = '<tr><td colspan="2" class="no-history">데이터를 불러오는 데 실패했습니다.</td></tr>';
  }
}

function renderHistoryList(list) {
  const tbody = document.getElementById("history-list-tbody");
  tbody.innerHTML = "";

  list.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.className = "history-row";

    const rawDate = item.date || item.id || "";
    let displayDate = rawDate;
    if (rawDate.length === 8 && !rawDate.includes("-")) {
      displayDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    }

    let title = item.novel_title || item.novelTitle;
    if (!title && item.geminiWork) {
      title = typeof item.geminiWork === 'object' ? item.geminiWork.title : "📖 제미나이의 문학 작품";
    }
    if (!title) title = "📖 제미나이의 문학 작품";

    tr.innerHTML = `
      <td>${escapeHtml(displayDate)}</td>
      <td><strong>${escapeHtml(title)}</strong></td>
    `;

    tr.addEventListener("click", () => openDetailModal(index));
    tbody.appendChild(tr);
  });
}

function openDetailModal(index) {
  const item = archivesData[index];
  if (!item) return;

  const rawDate = item.date || item.id || "";
  let displayDate = rawDate;
  if (rawDate.length === 8 && !rawDate.includes("-")) {
    displayDate = `${rawDate.slice(0, 4)}년 ${rawDate.slice(4, 6)}월 ${rawDate.slice(6, 8)}일`;
  } else if (rawDate.includes("-")) {
    const parts = rawDate.split("-");
    displayDate = `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
  }

  document.getElementById("modal-date").innerText = displayDate;

  let title = item.novel_title || item.novelTitle;
  let content = item.novel_content || item.novelContent;

  if (!title && item.geminiWork) {
    title = typeof item.geminiWork === 'object' ? item.geminiWork.title : "📖 제미나이의 문학 작품";
  }
  if (!content && item.geminiWork) {
    content = typeof item.geminiWork === 'object' ? item.geminiWork.content : item.geminiWork;
  }

  document.getElementById("modal-novel-title").innerText = title || "📖 제미나이의 문학 작품";
  document.getElementById("modal-novel-content").innerText = content || "작품 내용이 없습니다.";

  // 손패 이미지 렌더링
  const handContainer = document.getElementById("modal-mahjong-hand");
  handContainer.innerHTML = "";

  const prefixMap = { m: 'Man', p: 'Pin', s: 'Sou', z: 'Ji' };
  const tiles = item.tiles || [];

  tiles.forEach((tile) => {
    let fileName = "";
    const tileStr = String(tile).trim();

    const shortMatch = tileStr.match(/^([1-9])([mpsz])$/i);
    const fullNameMatch = tileStr.match(/^(Man|Pin|Sou|Ji)([1-9])$/i);

    if (shortMatch) {
      const num = shortMatch[1];
      const suit = shortMatch[2].toLowerCase();
      fileName = `${prefixMap[suit] || suit.toUpperCase()}${num}`;
    } else if (fullNameMatch) {
      const prefix = fullNameMatch[1].charAt(0).toUpperCase() + fullNameMatch[1].slice(1).toLowerCase();
      fileName = `${prefix}${fullNameMatch[2]}`;
    } else if (!isNaN(tile)) {
      fileName = `Man${tile}`;
    } else {
      fileName = tileStr;
    }

    if (fileName) {
      const img = document.createElement("img");
      img.src = `tile/${fileName}.svg`;
      img.alt = tileStr;
      img.className = "tile";
      handContainer.appendChild(img);
    }
  });

  // 정답 및 해설 세팅
  const answers = item.waitArray || item.answers || [];
  const waitText = item.waitText || `${answers.join(', ')}만`;
  const explanation = item.explanation || `오름패는 [ ${answers.map(v => v + '만').join(', ')} ] 입니다.`;

  document.getElementById("modal-answer-title").innerText = `💡 정답: ${waitText}`;
  document.getElementById("modal-answer-explanation").innerText = explanation;

  // 모달 열기
  document.getElementById("history-modal").classList.add("active");
}

function setupModalEvents() {
  const modal = document.getElementById("history-modal");
  const closeBtn = document.getElementById("modal-close-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
