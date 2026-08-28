function renderDecompositionExplanation() {
    if (currentMode === 'streak') return ''; 

    let html = `<div class="explanation-box">`;
    html += `<h4>🔍 대기패별 대기 유형 및 손패 구조 해설</h4>`;

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
                htmlContent: `<b>단기 대기 [ ${tile} ]</b> └ 치이토이츠(7쌍) 완성 형태 → <b style="color:#e67e22;">[${tile}, (${tile})]</b>`
            });
        });
    } else {
        validWaits.forEach(tile => {
            const decomps = winningDecompositions[tile] || [];
            decomps.forEach(d => {
                let waitType = d.waitType;

                if (!validateHandDecomposition(origCounts, d, tile, waitType, d.targetMeldStart)) {
                    return;
                }

                // 1. 양면 대기
                if (waitType === '양면') {
                    const w1 = d.targetMeldStart - 1;
                    const w2 = d.targetMeldStart + 2;

                    const waitTiles = [w1, w2].filter(x => validWaitsSet.has(x)).sort((a, b) => a - b);
                    if (waitTiles.length < 2) return;

                    let parts = [];
                    parts.push(`[${d.pair},${d.pair}]`);
                    d.triplets.forEach(t => parts.push(`[${t},${t},${t}]`));
                    
                    let targetMeldHandled = false; // ★ 대기 슌츠 변환 여부 플래그
                    d.sequences.forEach(s => {
                        // 대기 슌츠 시작 위치와 일치하고, 아직 처리되지 않은 첫 번째 슌츠만 강조 형태로 변환
                        if (!targetMeldHandled && s === d.targetMeldStart) {
                            parts.push(`<b style="color:#e67e22; font-weight:bold;">[(${w1}), ${s}, ${s+1}, (${w2})]</b>`);
                            targetMeldHandled = true;
                        } else {
                            parts.push(`[${s},${s+1},${s+2}]`);
                        }
                    });

                    itemsList.push({
                        waitType: '양면',
                        sortOrder: 1,
                        groupKey: `ryanmen_${waitTiles.join('_')}_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}_m${d.targetMeldStart}`,
                        tiles: waitTiles,
                        partsStr: parts.join(' ')
                    });

                // 2. 샤보 대기
                } else if (waitType === '샤보') {
                    let shanponTiles = [];
                    if (validWaitsSet.has(d.pair)) shanponTiles.push(d.pair);
                    d.triplets.forEach(t => {
                        if (validWaitsSet.has(t) && !shanponTiles.includes(t)) {
                            shanponTiles.push(t);
                        }
                    });
                    shanponTiles.sort((a, b) => a - b);

                    // 샤보 대기는 2개 쌍 형태로 분리
                    if (shanponTiles.length >= 2) {
                        for (let i = 0; i < shanponTiles.length; i++) {
                            for (let j = i + 1; j < shanponTiles.length; j++) {
                                const st1 = shanponTiles[i];
                                const st2 = shanponTiles[j];

                                let parts = [];
                                parts.push(`<b style="color:#e67e22; font-weight:bold;">[${st1},${st1},(${st1})]</b>`);
                                parts.push(`<b style="color:#e67e22; font-weight:bold;">[${st2},${st2},(${st2})]</b>`);

                                d.triplets.forEach(t => {
                                    if (t !== st1 && t !== st2) parts.push(`[${t},${t},${t}]`);
                                });
                                d.sequences.forEach(s => parts.push(`[${s},${s+1},${s+2}]`));

                                itemsList.push({
                                    waitType: '샤보',
                                    sortOrder: 2,
                                    groupKey: `shanpon_pair_${st1}_${st2}_seqs_${d.sequences.join('_')}`,
                                    tiles: [st1, st2],
                                    partsStr: parts.join(' ')
                                });
                            }
                        }
                    }

                // 3, 4, 5. 단기 / 간짱 / 변짱 대기
                } else {
                    if (!validWaitsSet.has(tile)) return;
                    let parts = [];

                    if (waitType === '단기') {
                        parts.push(`<b style="color:#e67e22; font-weight:bold;">[${tile}, (${tile})]</b>`);
                    } else {
                        parts.push(`[${d.pair},${d.pair}]`);
                    }

                    d.triplets.forEach(t => parts.push(`[${t},${t},${t}]`));

                    let targetMeldHandled = false;
                    d.sequences.forEach(s => {
                        if (!targetMeldHandled && d.targetMeldStart === s && (waitType === '간짱' || waitType === '변짱')) {
                            let meldStr = [];
                            for (let i = 0; i < 3; i++) {
                                let curr = s + i;
                                if (curr === tile) {
                                    meldStr.push(`(${curr})`);
                                } else {
                                    meldStr.push(curr);
                                }
                            }
                            parts.push(`<b style="color:#e67e22; font-weight:bold;">[${meldStr.join(',')}]</b>`);
                            targetMeldHandled = true;
                        } else {
                            parts.push(`[${s},${s+1},${s+2}]`);
                        }
                    });

                    let sortOrder = 3; 
                    if (waitType === '간짱') sortOrder = 4;
                    if (waitType === '변짱') sortOrder = 5;

                    itemsList.push({
                        waitType: waitType,
                        sortOrder: sortOrder,
                        groupKey: `${waitType}_tile${tile}_p${d.pair}_t${d.triplets.join(',')}_s${d.sequences.join(',')}_m${d.targetMeldStart}`,
                        tiles: [tile],
                        partsStr: parts.join(' ')
                    });
                }
            });
        });
    }

    // 중복 제거
    let uniqueMap = new Map();
    itemsList.forEach(item => {
        if (!uniqueMap.has(item.groupKey)) {
            uniqueMap.set(item.groupKey, item);
        }
    });

    let renderItems = Array.from(uniqueMap.values());

    // 1. 양면 -> 2. 샤보 -> 3. 단기 -> 4. 간짱 -> 5. 변짱 순서 정렬
    renderItems.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
        }
        return (a.tiles[0] || 0) - (b.tiles[0] || 0);
    });

    renderItems.forEach(group => {
        const tileHeader = group.tiles.length > 1 ? `[ ${group.tiles.join(', ')} ]` : `[ ${group.tiles[0]} ]`;

        if (group.htmlContent) {
            html += `<div class="explanation-item">${group.htmlContent}</div>`;
        } else {
            html += `<div class="explanation-item"><b>${group.waitType} 대기 ${tileHeader}</b> └ ${group.partsStr}</div>`;
        }
    });

    html += `</div>`;
    return html;
}
