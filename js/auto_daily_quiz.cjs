// js/auto_daily_quiz.cjs
const { execSync } = require('child_process');
const path = require('path');

// 날짜 인자 받기 (없으면 내일 날짜 기준)
const targetDate = process.argv[2] || getTomorrowStr();

console.log(`[Auto Process Start] Target Date: ${targetDate}`);

try {
  // 1. 퀴즈 생성
  console.log('1. Generating Quiz JSON...');
  execSync(`node ${path.join(__dirname, 'generate_quiz.cjs')} ${targetDate}`, { stdio: 'inherit' });

  // 2. Gemini 스토리 생성
  console.log('2. Generating Story via Gemini...');
  execSync(`node ${path.join(__dirname, 'generate_story.cjs')} ${targetDate}`, { stdio: 'inherit' });

  // 3. Firestore 업로드
  console.log('3. Uploading to Firestore...');
  execSync(`node ${path.join(__dirname, 'upload_quiz.cjs')} ${targetDate}`, { stdio: 'inherit' });

  console.log(`\n🎉 All tasks completed successfully for ${targetDate}!`);
} catch (error) {
  console.error('\n❌ Automation Pipeline Failed:', error.message);
  process.exit(1);
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
