/**
 * 청일색 기반 역만 검증 스크립트 (script_yakuman.js)
 * 
 * 검증 대상 역만:
 * - 순정구련보등 (Junsei Chuuren Poutou) / 구련보등 (Chuuren Poutou)
 * - 사암각 단기 (Suuankou Tanki) / 사암각 (Suuankou)
 * - 녹일색 (Ryuuisou)
 * - 청로두 (Chinroto)
 */

// -----------------------------------------------------------------
// 공통 헬퍼 함수
// -----------------------------------------------------------------

/**
 * 패 배열에서 각 패(1~9)의 개수를 카운트하여 반환 (1-based index)
 */
function getTileCounts(handArr) {
  const counts = Array(10).fill(0);
  handArr.forEach((tile) => {
    const num = Number(tile);
    if (num >= 1 && num <= 9) counts[num]++;
  });
  return counts;
}

/**
 * 4몸통 1머리 형태로 분해 가능한지 탐색하는 함수
 */
function findDecompositionsForYakuman(counts) {
  const results = [];
  const tempCounts = [...counts];

  for (let p = 1; p <= 9; p++) {
    if (tempCounts[p] >= 2) {
      tempCounts[p] -= 2;
      searchMeldsForYakuman(tempCounts, 1, [], (foundMelds) => {
        results.push({
          pair: p,
          melds: foundMelds.map((m) => ({ type: m.type, tiles: [...m.tiles] }))
        });
      });
      tempCounts[p] += 2;
    }
  }
  return results;
}

function searchMeldsForYakuman(counts, startRank, currentMelds, callback) {
  if (currentMelds.length === 4) {
    callback(currentMelds);
    return;
  }
  let r = startRank;
  while (r <= 9 && counts[r] === 0) r++;
  if (r > 9) return;

  if (counts[r] >= 3) {
    counts[r] -= 3;
    currentMelds.push({ type: "PUNG", tiles: [r, r, r] });
    searchMeldsForYakuman(counts, r, currentMelds, callback);
    currentMelds.pop();
    counts[r] += 3;
  }

  if (r <= 7 && counts[r] >= 1 && counts[r + 1] >= 1 && counts[r + 2] >= 1) {
    counts[r]--; counts[r + 1]--; counts[r + 2]--;
    currentMelds.push({ type: "CHOW", tiles: [r, r + 1, r + 2] });
    searchMeldsForYakuman(counts, r, currentMelds, callback);
    currentMelds.pop();
    counts[r]++; counts[r + 1]++; counts[r + 2]++;
  }
}


// -----------------------------------------------------------------
// 1. 주어진 13개 패가 '역만 텐파이' 상태인지 검증하는 함수
// -----------------------------------------------------------------

/**
 * 13장의 핸드가 어떤 역만의 텐파이 상태인지 검증합니다.
 * @param {number|string} suit - 수패 종류 (1: 만수, 2: 통수, 3: 삭수)
 * @param {Array<number>|string} hand - 13장의 패
 * @returns {Object} { isYakumanTenpai: boolean, possibleYakuman: Array<string> }
 */
function checkYakumanTenpai(suit, hand) {
  const suitNum = Number(suit);
  const handArr = (typeof hand === "string" ? hand.split("") : (Array.isArray(hand) ? hand : String(hand).split("")))
    .map(Number)
    .sort((a, b) => a - b);

  if (handArr.length !== 13) {
    return { isYakumanTenpai: false, possibleYakuman: [] };
  }

  const possibleYakumanSet = new Set();

  // 1~9 오름패를 하나씩 가상으로 추가해보고 역만이 성립하는 오름패가 있는지 확인
  for (let tile = 1; tile <= 9; tile++) {
    const counts = getTileCounts(handArr);
    if (counts[tile] >= 4) continue; // 동일 패 4장 초과 불가능

    // 론/츠모 두 경우 모두 확인하여 텐파이 여부 체킹
    const resTsumo = checkYakumanWin(suitNum, handArr, tile, true);
    const resRon = checkYakumanWin(suitNum, handArr, tile, false);

    if (resTsumo.isYakuman) {
      resTsumo.yakumanList.forEach((y) => possibleYakumanSet.add(y.nameKey));
    }
    if (resRon.isYakuman) {
      resRon.yakumanList.forEach((y) => possibleYakumanSet.add(y.nameKey));
    }
  }

  const possibleYakuman = Array.from(possibleYakumanSet);

  return {
    isYakumanTenpai: possibleYakuman.length > 0,
    possibleYakuman: possibleYakuman
  };
}


// -----------------------------------------------------------------
// 2. 13개 패 + 오름패로 실제 역만 화료가 가능한지 검증하는 함수
// -----------------------------------------------------------------

/**
 * 13장의 핸드에 오름패가 들어가 실제 역만 화료가 가능한지 검증합니다.
 * @param {number|string} suit - 수패 종류 (1: 만수, 2: 통수, 3: 삭수)
 * @param {Array<number>|string} hand - 13장의 패
 * @param {number|string} winTile - 오름패 (1~9)
 * @param {boolean} isTsumo - 츠모 여부 (true: 츠모, false: 론)
 * @returns {Object} { isYakuman: boolean, yakumanCount: number, yakumanList: Array<{nameKey: string, value: number}> }
 */
function checkYakumanWin(suit, hand, winTile, isTsumo = true) {
  const suitNum = Number(suit);
  const handArr = (typeof hand === "string" ? hand.split("") : (Array.isArray(hand) ? hand : String(hand).split("")))
    .map(Number)
    .sort((a, b) => a - b);
  const cardNum = Number(winTile);

  if (handArr.length !== 13 || isNaN(cardNum) || cardNum < 1 || cardNum > 9) {
    return { isYakuman: false, yakumanCount: 0, yakumanList: [] };
  }

  const totalTiles = [...handArr, cardNum].sort((a, b) => a - b);
  const counts = getTileCounts(totalTiles);

  // 패 개수 유효성 검사 (동일 패 5장 이상 불가능)
  for (let i = 1; i <= 9; i++) {
    if (counts[i] > 4) {
      return { isYakuman: false, yakumanCount: 0, yakumanList: [] };
    }
  }

  const yakumanList = [];

  // A. 순정구련보등 (1112345678999 대기 형태에 오름패)
  if (handArr.join("") === "1112345678999") {
    yakumanList.push({ nameKey: "yaku.junseiChuuren", value: 2 });
  } 
  // B. 구련보등
  else {
    let isChuuren = counts[1] >= 3 && counts[9] >= 3;
    for (let i = 2; i <= 8; i++) {
      if (counts[i] < 1) isChuuren = false;
    }
    if (isChuuren) {
      yakumanList.push({ nameKey: "yaku.chuuren", value: 1 });
    }
  }

  const decompositions = findDecompositionsForYakuman(counts);

  // C. 사암각 단기 & 사암각
  let hasSuuankouTanki = false;
  let hasSuuankou = false;

  for (const dec of decompositions) {
    const pungs = dec.melds.filter((m) => m.type === "PUNG");
    if (pungs.length === 4) {
      if (cardNum === dec.pair) {
        hasSuuankouTanki = true; // 단기 대기
      } else if (isTsumo) {
        hasSuuankou = true; // 샤보 대기 + 츠모 화료
      }
    }
  }

  if (hasSuuankouTanki) {
    yakumanList.push({ nameKey: "yaku.suuankouTanki", value: 2 });
  } else if (hasSuuankou) {
    yakumanList.push({ nameKey: "yaku.suuankou", value: 1 });
  }

  // D. 녹일색 (삭수이고 2,3,4,6,8 패로만 구성)
  if (suitNum === 3) {
    const isAllGreen = totalTiles.every((t) => [2, 3, 4, 6, 8].includes(t));
    if (isAllGreen && decompositions.length > 0) {
      yakumanList.push({ nameKey: "yaku.ryuuisou", value: 1 });
    }
  }

  // E. 청로두 (1, 9로만 구성)
  const isAllTerminals = totalTiles.every((t) => t === 1 || t === 9);
  if (isAllTerminals && ((counts[1] % 3 === 2 && counts[9] % 3 === 0) || (counts[1] % 3 === 0 && counts[9] % 3 === 2))) {
    yakumanList.push({ nameKey: "yaku.chinroto", value: 1 });
  }

  const totalYakumanVal = yakumanList.reduce((acc, cur) => acc + cur.value, 0);

  return {
    isYakuman: yakumanList.length > 0,
    yakumanCount: totalYakumanVal,
    yakumanList: yakumanList
  };
}
