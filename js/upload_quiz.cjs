const fs = require('fs');
const path = require('path');

const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// 1. 서비스 계정 키 파싱
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountRaw) {
  console.error("Error: FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

let serviceAccount = JSON.parse(serviceAccountRaw);

// 2. Firebase Admin SDK 초기화
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function uploadDailyQuiz() {
  try {
    // 지정된 날짜가 없으면 오늘 날짜 사용 (YYYY-MM-DD & YYYYMMDD)
    const targetDateStr = process.argv[2];
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    const isoDate = `${year}-${month}-${day}`;
    const dateKey = `${year}${month}${day}`;

    // data/quiz_YYYYMMDD.json 읽기
    const quizPath = path.join(__dirname, 'data', `quiz_${dateKey}.json`);
    if (!fs.existsSync(quizPath)) {
      throw new Error(`Quiz JSON file not found: ${quizPath}`);
    }
    const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));

    // js/upload_quiz.cjs (스토리 JSON 읽는 부분)
    // quiz_hint.json (Gemini 생성 문학) 읽기

    let novelTitle = "📖 제미나이의 문학 작품";
    let novelContent = "오늘의 작품을 준비 중입니다.";

    // data/story_YYYYMMDD.json 경로에서 스토리 읽기 (없으면 기존 quiz_hint.json 체크)
    const storyPath = path.join(__dirname, 'data', `story_${dateKey}.json`);
    const fallbackHintPath = path.join(__dirname, 'quiz_hint.json');

    if (fs.existsSync(storyPath)) {
      const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf-8'));
      novelTitle = storyData.title || novelTitle;
      novelContent = storyData.content || novelContent;
    } else if (fs.existsSync(fallbackHintPath)) {
      const hintData = JSON.parse(fs.readFileSync(fallbackHintPath, 'utf-8'));
      novelTitle = hintData.title || novelTitle;
      novelContent = hintData.content || novelContent;
    }

    const docRef = db.collection('daily_quiz_archives').doc(isoDate);

    const payload = {
      date: isoDate,
      suit: quizData.suit || 'man',
      suitUnit: quizData.suitUnit || '만',
      tiles: quizData.tiles,
      waitArray: quizData.waitArray,
      explanation: quizData.explanation,
      novel_title: novelTitle,
      novel_content: novelContent,
      createdAt: FieldValue.serverTimestamp()
    };

    await docRef.set(payload, { merge: true });
    console.log(`Successfully uploaded quiz archive for date: ${isoDate}`);
  } catch (error) {
    console.error("Error uploading to Firestore:", error);
    process.exit(1);
  }
}

uploadDailyQuiz();

