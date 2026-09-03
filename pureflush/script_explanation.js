/* =============================================================
   📌 패 해석 및 설명 생성 모듈 (script_explanation.js)
   ============================================================= */

/**
 * 대기 형태(양면, 단기, 샤보, 간짱, 변짱)에 해당하는 뱃지 HTML을 반환합니다.
 */
function getWaitTypeBadgeHtml(waitType) {
    switch(waitType) {
        case '양면': return `<span class="wait-type-badge badge-ryanmen">${t('waitRyanmen')}</span>`;
        case '단기': return `<span class="wait-type-badge badge-tanki">${t('waitTanki')}</span>`;
        case '샤보': return `<span class="wait-type-badge badge-shanpon">${t('waitShanpon')}</span>`;
        case '간짱': return `<span class="wait-type-badge badge-kanchan">${t('waitKanchan')}</span>`;
        case '변짱': return `<span class="wait-type-badge badge-penchan">${t('waitPenchan')}</span>`;
        default: return `<span class="wait-type-badge badge-tanki">${waitType}</span>`;
    }
}

/**
 * 양면 대기 형태 분석 항목을 생성합니다.
 */
function getRyanmenExplanationItems(d, validWaitsSet) {
    const w1 = d.targetMeldStart - 1;
    const w2 = d.targetMeldStart + 2;
    const w1Valid = validWaitsSet.has(w1);
    const w2Valid = validWaitsSet.has(w2);

    const waitTiles = [w1, w2].filter(x => validWaitsSet.has(x)).sort((a, b) => a - b);
    if (waitTiles.length < 2) return null;

    const w1Str = w1Valid ? `<span class="filled-slot">(${w1})</span>` : '';
    const w2Str = w2Valid ? `<span class="filled-slot">(${w2})</span>` : '';

    let parts = [];
    parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));

    let targetMeldHandled = false;
    d.sequences.forEach(s => {
        if (!targetMeldHandled && s === d.targetMeldStart) {
            let meldParts = [];
            if (w1Str) meldParts.push(w1Str);
            meldParts.push(s);
            meldParts.push(s + 1);
            if (w2Str) meldParts.push(w2Str);

            parts.push(`<span style="color:#2980b9; font-weight:bold;">[${meldParts.join(', ')}]</span>`);
            targetMeldHandled = true;
        } else {
            parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`);
        }
    });

    const groupKey = `ryanmen_p${d.pair}_t${d.triplets.slice().sort().join(',')}_s${d.sequences.slice().sort().join(',')}_m${d.targetMeldStart}`;
    return {
        waitType: '양면',
        sortOrder: 1,
        groupKey: groupKey,
        tiles: waitTiles,
        partsStr: parts.join(' ')
    };
}

/**
 * 샤보 대기 형태 분석 항목을 생성합니다.
 */
function getShanponExplanationItems(d, tile, validWaitsSet, origCounts) {
    let items = [];
    const p = d.pair;

    d.triplets.forEach(t => {
        if (t === tile || p === tile) {
            const shanponPair = [p, t].sort((a, b) => a - b);
            const st1 = shanponPair[0];
            const st2 = shanponPair[1];

            const st1Is4Count = origCounts[st1] === 4;
            const st2Is4Count = origCounts[st2] === 4;

            if (origCounts[st1] >= 2 && origCounts[st2] >= 2) {
                let parts = [];
                parts.push(`<span style="color:#27ae60; font-weight:bold;">[${st1}, ${st1}, <span class="filled-slot">(${st1})</span>]</span>`);
                parts.push(`<span style="color:#27ae60; font-weight:bold;">[${st2}, ${st2}, <span class="filled-slot">(${st2})</span>]</span>`);

                d.triplets.forEach(tr => {
                    if (tr !== p && tr !== t) {
                        parts.push(`<span style="color:#27ae60;">[${tr},${tr},${tr}]</span>`);
                    }
                });
                d.sequences.forEach(s => parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`));

                let noteStr = '';
                if (st1Is4Count || st2Is4Count) {
                    const overTiles = [st1Is4Count ? st1 : null, st2Is4Count ? st2 : null].filter(Boolean);
                    noteStr = ` <span style="color:#e74c3c; font-size:0.9em; font-weight:normal;">${t('maxedNotice', { tiles: overTiles.join(', ') })}</span>`;
                }

                const remainingTriplets = d.triplets.filter(tr => tr !== p && tr !== t).sort().join('_');
                const sortedSeqs = d.sequences.slice().sort().join('_');
                const groupKey = `shanpon_pair_${st1}_${st2}_remT_${remainingTriplets}_seqs_${sortedSeqs}`;

                items.push({
                    waitType: '샤보',
                    sortOrder: 2,
                    groupKey: groupKey,
                    tiles: [st1, st2],
                    partsStr: parts.join(' ') + noteStr
                });
            }
        }
    });

    return items;
}

/**
 * 단일 대기 형태(단기, 간짱, 변짱) 분석 항목을 생성합니다.
 */
function getSingleWaitExplanationItems(d, tile, waitType, validWaitsSet) {
    if (!validWaitsSet.has(tile)) return null;

    let parts = [];
    if (waitType === '단기') {
        parts.push(`<span style="color:#d35400; font-weight:bold;">[${tile}, <span class="filled-slot">(${tile})</span>]</span>`);
    } else {
        parts.push(`<span style="color:#d35400;">[${d.pair},${d.pair}]</span>`);
    }

    d.triplets.forEach(t => parts.push(`<span style="color:#27ae60;">[${t},${t},${t}]</span>`));

    let targetMeldHandled = false;
    d.sequences.forEach(s => {
        if (!targetMeldHandled && d.targetMeldStart === s && (waitType === '간짱' || waitType === '변짱')) {
            let meldStr = [];
            for (let i = 0; i < 3; i++) {
                let curr = s + i;
                if (curr === tile) {
                    meldStr.push(`<span class="filled-slot">(${curr})</span>`);
                } else {
                    meldStr.push(curr);
                }
            }
            parts.push(`<span style="color:#2980b9; font-weight:bold;">[${meldStr.join(',')}]</span>`);
            targetMeldHandled = true;
        } else {
            parts.push(`<span style="color:#2980b9;">[${s},${s+1},${s+2}]</span>`);
        }
    });

    let sortOrder = 3; 
    if (waitType === '간짱') sortOrder = 4;
    if (waitType === '변짱') sortOrder = 5;

    const groupKey = `${waitType}_tile${tile}_p${d.pair}_t${d.triplets.slice().sort().join(',')}_s${d.sequences.slice().sort().join(',')}_m${d.targetMeldStart}`;

    return {
        waitType: waitType,
        sortOrder: sortOrder,
        groupKey: groupKey,
        tiles: [tile],
        partsStr: parts.join(' ')
    };
}

/**
 * 수패 분해 조합 해설 HTML을 생성합니다.
 */
function renderDecompositionExplanation() {
    if (currentMode === 'streak') return ''; 

    let html = `<div class="explanation-box">`;
    html += `<h4>${t('explanationTitle')}</h4>`;

    let origCounts = Array(10).fill(0);
    currentHand.forEach(n => origCounts[n]++);

    const validWaits = [...winningTiles].sort((a, b) => a - b);
    const validWaitsSet = new Set(validWaits);
    let itemsList = [];

    if (isChiitoiHand) {
        validWaits.forEach(tile => {
            itemsList.push({
                waitType: '단기',
                sortOrder: 3,
                groupKey: `chiitoi_${tile}`,
                tiles: [tile],
                htmlContent: `${getWaitTypeBadgeHtml('단기')} <b>[ ${tile} ]</b> └ <span style="color:#d35400;">[${tile}, <span class="filled-slot">(${tile})</span>]</span>`
            });
        });
    } else {
        const allWaitCandidates = new Set([...validWaits]);
        for (let tNum = 1; tNum <= 9; tNum++) {
            if (origCounts[tNum] === 4) allWaitCandidates.add(tNum);
        }
        const candidateWaits = [...allWaitCandidates].sort((a, b) => a - b);

        candidateWaits.forEach(tile => {
            const decomps = winningDecompositions[tile] || [];
            decomps.forEach(d => {
                let waitType = d.waitType;
                if (waitType === '양면') {
                    const item = getRyanmenExplanationItems(d, validWaitsSet);
                    if (item) itemsList.push(item);
                } else if (waitType === '샤보') {
                    const items = getShanponExplanationItems(d, tile, validWaitsSet, origCounts);
                    itemsList.push(...items);
                } else {
                    const item = getSingleWaitExplanationItems(d, tile, waitType, validWaitsSet);
                    if (item) itemsList.push(item);
                }
            });
        });
    }

    let uniqueMap = new Map();
    itemsList.forEach(item => {
        if (!uniqueMap.has(item.groupKey)) uniqueMap.set(item.groupKey, item);
    });

    let renderItems = Array.from(uniqueMap.values());
    renderItems.sort((a, b) => (a.sortOrder !== b.sortOrder) ? a.sortOrder - b.sortOrder : (a.tiles[0] || 0) - (b.tiles[0] || 0));

    renderItems.forEach(group => {
        const tileHeader = group.tiles.length > 1 ? `[ ${group.tiles.join(', ')} ]` : `[ ${group.tiles[0]} ]`;
        const badge = getWaitTypeBadgeHtml(group.waitType);

        if (group.htmlContent) {
            html += `<div class="explanation-item">${group.htmlContent}</div>`;
        } else {
            html += `<div class="explanation-item">${badge} <b>${tileHeader}</b> --- ${group.partsStr}</div>`;
        }
    });

    html += `</div>`;
    return html;
}

/**
 * 대기패와 형태 분석을 포함한 정답 및 해설 텍스트 전체를 구성합니다.
 */
function getAnswerString() {
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">${t('ryanpeikouNotice')}</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">${t('chiitoiNotice')}</div><br>`;
    }

    const actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : '-';
    let baseText = '';

    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        baseText = `${tagNotice}${t('actualWaits')}: [ ${actualStr} ] &nbsp;|&nbsp; ${t('theoreticalWaits')}: [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">${t('maxedNotice', { tiles: maxedOutWinningTiles.join(', ') })}</small>`;
    } else {
        baseText = `${tagNotice}${t('actualWaits')}: [ ${actualStr} ]`;
    }

    if (currentMode !== 'streak') {
        baseText += renderDecompositionExplanation();
    }

    return baseText;
}