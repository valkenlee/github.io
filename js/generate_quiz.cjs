const fs = require('fs');
const path = require('path');

// 시드 기반 난수 생성기
function seededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 14장 완성 손패 생성
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

// 완성 형태 검증
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

// 멘츠(몸통) 검증
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

// 대기패 산출
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

// 퀴즈 생성 메인 로직
function generateDailyTenpaiQuiz(seedNumber) {
  const rng = seededRandom(seedNumber);

  // 시드 기반 수패 선택 (만수패, 통수패, 삭수패)
  const suits = [
    { key: 'man', name: '만수패', unit: '만', symbol: '萬' },
    { key: 'pin', name: '통수패', unit: '통', symbol: '筒' },
    { key: 'sou', name: '삭수패', unit: '삭', symbol: '索' }
  ];
  const selectedSuit = suits[Math.floor(rng() * suits.length)];

  while (true) {
    const hand14 = generate14TileHand(rng);
    const removeIdx = Math.floor(rng() * 14);
    const hand13 = [...hand14];
    hand13.splice(removeIdx, 1);
    hand13.sort((a, b) => a - b);

    const waitArray = getWaitArray(hand13);

    if (waitArray.length > 0) {
      return {
        suit: selectedSuit.key,
        suitName: selectedSuit.name,
        suitUnit: selectedSuit.unit,
        tiles: hand13,
        waitArray: waitArray,
        waitText: `${waitArray.join(', ')}${selectedSuit.unit} (${waitArray.length}면대기)`,
        explanation: `오늘의 알고리즘 계산 오름패는 총 ${waitArray.length}개 [ ${waitArray.map(v => v + selectedSuit.unit).join(', ')} ] 입니다.`
      };
    }
  }
}

function main() {
  const targetDateStr = process.argv[2];
  let year, month, day, dateKey;

  if (targetDateStr) {
    const cleanDate = targetDateStr.replace(/-/g, '');
    year = cleanDate.substring(0, 4);
    month = cleanDate.substring(4, 6);
    day = cleanDate.substring(6, 8);
    dateKey = cleanDate;
  } else {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1); // 기본값: 내일 날짜
    year = targetDate.getFullYear();
    month = String(targetDate.getMonth() + 1).padStart(2, '0');
    day = String(targetDate.getDate()).padStart(2, '0');
    dateKey = `${year}${month}${day}`;
  }

  const seedNumber = parseInt(dateKey, 10);
  const quizData = generateDailyTenpaiQuiz(seedNumber);

  const result = {
    date: `${year}-${month}-${day}`,
    seed: seedNumber,
    quizKey: `quiz_${dateKey}`,
    ...quizData
  };

  const outputDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `quiz_${dateKey}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Quiz generated successfully: ${outputPath}`);
}

main();
