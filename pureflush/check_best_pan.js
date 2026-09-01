/**
 * 청일색 화료 패의 역과 판수를 계산하는 함수 (i18n 호환)
 */
function calc_pan(suit, hand, card, reach, win_card) {
  // 1. 입력값 정규화 및 유효성 검사
  const suitNum = Number(suit);
  const handArr = (typeof hand === "string" ? hand.split("") : hand)
    .map(Number)
    .sort((a, b) => a - b);
  const winTile = Number(card);
  const isReach = String(reach) === "1";
  const isTsumo = String(win_card) === "1";

  if (handArr.length !== 13 || isNaN(winTile) || winTile < 1 || winTile > 9) {
    return { isValid: false, message: t("bestReport.errInvalidHand") };
  }

  // 14장의 전체 패
  const totalTiles = [...handArr, winTile].sort((a, b) => a - b);
  const counts = Array(10).fill(0);
  totalTiles.forEach((tTile) => counts[tTile]++);

  // 동일 패 5장 이상 존재 여부 검사
  for (let i = 1; i <= 9; i++) {
    if (counts[i] > 4) {
      return { isValid: false, message: t("bestReport.errMax4Tiles") };
    }
  }

  // 가능 분해 형태(4몸통 1머리) 탐색
  const decompositions = findDecompositions(counts);

  // -----------------------------------------------------------------
  // 2. 역만(Yakuman) 우선 검사
  // -----------------------------------------------------------------
  let yakumanList = [];

  // A. 순정구련보등
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

  // C. 사암각 단기 & 사암각
  let hasSuuankouTanki = false;
  let hasSuuankou = false;

  for (const dec of decompositions) {
    const pungs = dec.melds.filter((m) => m.type === "PUNG");
    if (pungs.length === 4) {
      if (winTile === dec.pair) {
        hasSuuankouTanki = true;
      } else if (isTsumo) {
        hasSuuankou = true;
      }
    }
  }

  if (hasSuuankouTanki) {
    yakumanList.push({ nameKey: "yaku.suuankouTanki", value: 2 });
  } else if (hasSuuankou) {
    yakumanList.push({ nameKey: "yaku.suuankou", value: 1 });
  }

  // D. 녹일색
  if (suitNum === 3) {
    const isAllGreen = totalTiles.every((tTile) => [2, 3, 4, 6, 8].includes(tTile));
    if (isAllGreen && decompositions.length > 0) {
      yakumanList.push({ nameKey: "yaku.ryuuisou", value: 1 });
    }
  }

  // E. 청로두
  const isAllTerminals = totalTiles.every((tTile) => tTile === 1 || tTile === 9);
  if (isAllTerminals && ((counts[1] % 3 === 2 && counts[9] % 3 === 0) || (counts[1] % 3 === 0 && counts[9] % 3 === 2))) {
    yakumanList.push({ nameKey: "yaku.chinroto", value: 1 });
  }

  // 역만 성립 시
  if (yakumanList.length > 0) {
    const totalYakumanVal = yakumanList.reduce((acc, cur) => acc + cur.value, 0);
    const yakuNames = yakumanList.map((y) => t(y.nameKey));
    
    const yakumanText = totalYakumanVal > 1 
      ? t("bestReport.yakumanFormat", { count: totalYakumanVal }) 
      : t("bestReport.yakuman");

    return {
      isValid: true,
      isYakuman: true,
      yakumanCount: totalYakumanVal,
      yakuList: yakuNames,
      formatted: `${yakumanText} (${yakuNames.join(", ")})`
    };
  }

  // -----------------------------------------------------------------
  // 3. 일반 역 계산
  // -----------------------------------------------------------------
  let maxHan = 0;
  let bestYakuKeys = [];

  // 3-1. 치이토이츠
  if (isChiitoitsu(counts)) {
    let han = 6;
    let yakuKeys = ["yaku.chinitsu", "yaku.chiitoi"];
    han += 2;

    if (isReach) { han += 1; yakuKeys.push("yaku.reach"); }
    if (isTsumo) { han += 1; yakuKeys.push("yaku.tsumo"); }
    if (totalTiles.every((tTile) => tTile >= 2 && tTile <= 8)) { han += 1; yakuKeys.push("yaku.tanyao"); }

    if (han > maxHan) {
      maxHan = han;
      bestYakuKeys = yakuKeys;
    }
  }

  // 3-2. 일반 형태(4몸통 1머리)
  for (const dec of decompositions) {
    const attributions = getAttributions(dec, winTile);

    for (const attr of attributions) {
      let han = 6;
      let yakuKeys = ["yaku.chinitsu"];

      if (isReach) { han += 1; yakuKeys.push("yaku.reach"); }
      if (isTsumo) { han += 1; yakuKeys.push("yaku.tsumo"); }

      if (totalTiles.every((tTile) => tTile >= 2 && tTile <= 8)) {
        han += 1;
        yakuKeys.push("yaku.tanyao");
      }

      const isAllChows = dec.melds.every((m) => m.type === "CHOW");
      if (isAllChows && attr.waitType === "RYANMEN") {
        han += 1;
        yakuKeys.push("yaku.pinfu");
      }

      const chowStrings = dec.melds.filter((m) => m.type === "CHOW").map((m) => m.tiles.join(""));
      const chowCounts = {};
      chowStrings.forEach((s) => (chowCounts[s] = (chowCounts[s] || 0) + 1));
      const pairCount = Object.values(chowCounts).filter((c) => c >= 2).length;
      const quadCount = Object.values(chowCounts).filter((c) => c === 4).length;

      if (pairCount === 2 || quadCount === 1) {
        han += 3;
        yakuKeys.push("yaku.ryanpeikou");
      } else if (pairCount === 1) {
        han += 1;
        yakuKeys.push("yaku.iipeikou");
      }

      const uniqueChows = new Set(chowStrings);
      if (uniqueChows.has("123") && uniqueChows.has("456") && uniqueChows.has("789")) {
        han += 2;
        yakuKeys.push("yaku.ittsu");
      }

      const isJunchan = dec.melds.every((m) => m.tiles.includes(1) || m.tiles.includes(9)) && (dec.pair === 1 || dec.pair === 9);
      if (isJunchan) {
        han += 3;
        yakuKeys.push("yaku.junchan");
      }

      const isToitoi = dec.melds.every((m) => m.type === "PUNG");
      if (isToitoi) {
        han += 2;
        yakuKeys.push("yaku.toitoi");
      }

      let concealedPungs = 0;
      dec.melds.forEach((m, idx) => {
        if (m.type === "PUNG") {
          if (idx === attr.meldIndex) {
            if (isTsumo) concealedPungs++;
          } else {
            concealedPungs++;
          }
        }
      });
      if (concealedPungs >= 3) {
        han += 2;
        yakuKeys.push("yaku.sanankou");
      }

      if (han > maxHan) {
        maxHan = han;
        bestYakuKeys = yakuKeys;
      }
    }
  }

  if (maxHan === 0) {
    return {
      isValid: false,
      message: t("bestReport.errNotChinitsu")
    };
  }

  const translatedYakuList = bestYakuKeys.map((k) => t(k));

  return {
    isValid: true,
    isYakuman: false,
    han: maxHan,
    yakuKeys: bestYakuKeys,
    yakuList: translatedYakuList,
    formatted: `${t("bestReport.han", { count: maxHan })} (${translatedYakuList.join(", ")})`
  };
}

// -----------------------------------------------------------------
// 헬퍼 함수들
// -----------------------------------------------------------------

function findDecompositions(counts) {
  const results = [];
  for (let p = 1; p <= 9; p++) {
    if (counts[p] >= 2) {
      counts[p] -= 2;
      searchMelds(counts, 1, [], (foundMelds) => {
        results.push({ pair: p, melds: foundMelds.map((m) => ({ type: m.type, tiles: [...m.tiles] })) });
      });
      counts[p] += 2;
    }
  }
  return results;
}

function searchMelds(counts, startRank, currentMelds, callback) {
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
    searchMelds(counts, r, currentMelds, callback);
    currentMelds.pop();
    counts[r] += 3;
  }

  if (r <= 7 && counts[r] >= 1 && counts[r + 1] >= 1 && counts[r + 2] >= 1) {
    counts[r]--; counts[r + 1]--; counts[r + 2]--;
    currentMelds.push({ type: "CHOW", tiles: [r, r + 1, r + 2] });
    searchMelds(counts, r, currentMelds, callback);
    currentMelds.pop();
    counts[r]++; counts[r + 1]++; counts[r + 2]++;
  }
}

function getAttributions(dec, winTile) {
  const attributions = [];
  if (winTile === dec.pair) {
    attributions.push({ meldIndex: -1, waitType: "TANKI" });
  }

  dec.melds.forEach((meld, idx) => {
    if (meld.type === "PUNG" && winTile === meld.tiles[0]) {
      attributions.push({ meldIndex: idx, waitType: "SHANPON" });
    } else if (meld.type === "CHOW") {
      const [a, b, c] = meld.tiles;
      if (winTile === a || winTile === b || winTile === c) {
        let waitType = "OTHER";
        if (winTile === b) {
          waitType = "KANCHAN";
        } else if (winTile === a) {
          waitType = c === 9 ? "PENCHAN" : "RYANMEN";
        } else if (winTile === c) {
          waitType = a === 1 ? "PENCHAN" : "RYANMEN";
        }
        attributions.push({ meldIndex: idx, waitType: waitType });
      }
    }
  });
  return attributions;
}

function isChiitoitsu(counts) {
  let pairCount = 0;
  for (let i = 1; i <= 9; i++) {
    if (counts[i] === 2) pairCount++;
    else if (counts[i] !== 0) return false;
  }
  return pairCount === 7;
}

/**
 * 세부 역 목록을 "역이름 판수" 형태의 문자열 배열로 반환
 */
function getDetailedYakuList(yakuKeys) {
  const yakuHanMap = {
    "yaku.chinitsu": 6,
    "yaku.reach": 1,
    "yaku.tsumo": 1,
    "yaku.tanyao": 1,
    "yaku.pinfu": 1,
    "yaku.iipeikou": 1,
    "yaku.ittsu": 2,
    "yaku.junchan": 3,
    "yaku.chiitoi": 2,
    "yaku.ryanpeikou": 3,
    "yaku.toitoi": 2,
    "yaku.sanankou": 2
  };

  return yakuKeys.map((key) => {
    const han = yakuHanMap[key];
    const name = t(key);
    return han ? `${name} ${t("bestReport.han", { count: han })}` : name;
  });
}

/**
 * 손패에 대해 1~9 오름패 각각의 판수 분석 및 최적의 선택 확인 함수
 */
function check_best_pan(suit, hand, card, reach, win_card) {
  const handArr = (typeof hand === "string" ? hand.split("") : hand).map(Number);
  const selectedTile = Number(card);

  const handCounts = Array(10).fill(0);
  handArr.forEach((tTile) => handCounts[tTile]++);

  const results = [];
  let maxScore = -1;

  for (let tile = 1; tile <= 9; tile++) {
    if (handCounts[tile] >= 4) {
      results.push({
        tile: tile,
        score: 0,
        isValid: false,
        type: 'INVALID_4TILES',
        text: t("bestReport.invalid4Tiles")
      });
      continue;
    }

    const res = calc_pan(suit, hand, tile, reach, win_card);

    if (!res.isValid) {
      results.push({
        tile: tile,
        score: 0,
        isValid: false,
        type: 'INVALID_NO_YAKU',
        text: t("bestReport.invalidNoYaku")
      });
    } else if (res.isYakuman) {
      const score = res.yakumanCount * 13;
      if (score > maxScore) maxScore = score;

      const yakumanLabel = t("bestReport.yakuman");
      const scoreHanText = t("bestReport.han", { count: score });

      results.push({
        tile: tile,
        score: score,
        isValid: true,
        type: 'VALID',
        text: `${scoreHanText} (${yakumanLabel} - ${res.yakuList.join(", ")})`
      });
    } else {
      const score = Math.min(res.han, 13);
      if (score > maxScore) maxScore = score;

      const detailedYaku = getDetailedYakuList(res.yakuKeys);
      const scoreHanText = t("bestReport.han", { count: score });

      results.push({
        tile: tile,
        score: score,
        isValid: true,
        type: 'VALID',
        text: `${scoreHanText} (${detailedYaku.join(", ")})`
      });
    }
  }

  const bestTiles = results
    .filter((r) => r.isValid && r.score === maxScore && maxScore > 0)
    .map((r) => r.tile);

  const labelBest = t("bestReport.labelBest");
  const labelValid = t("bestReport.labelValid");
  const labelInvalid = t("bestReport.labelInvalid");

  results.forEach((r) => {
    const isBest = r.isValid && r.score === maxScore && maxScore > 0;

    if (isBest) {
      console.log(`\x1b[42m\x1b[37m\x1b[1m ${labelBest} ${r.tile} ➔ ${r.text} \x1b[0m`);
    } else if (r.isValid) {
      console.log(`\x1b[36m ${labelValid} ${r.tile} ➔ ${r.text}\x1b[0m`);
    } else {
      console.log(`\x1b[90m ${labelInvalid} ${r.tile} ➔ ${r.text}\x1b[0m`);
    }
  });

  return {
    bestTiles: bestTiles,
    maxScore: maxScore,
    isUserBestChoice: bestTiles.includes(selectedTile),
    analysis: results
  };
}