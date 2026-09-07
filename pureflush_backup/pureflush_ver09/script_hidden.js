/* -------------------------------------------------------------
   🔒 히든 패 분석기 트리거
------------------------------------------------------------- */
function isWrappedEnvironment() {
    return Boolean(
        window.__IS_WRAPPED__ === true ||
        window.location.href.includes('wrapped=true') ||
        Array.from(document.scripts).some(s => s.src && s.src.includes('wrapped=true'))
    );
}

function initTitleClickTrigger() {
    const mainTitle = document.getElementById('title-icon');
    if (!mainTitle) return;

    mainTitle.addEventListener('click', () => {
        if (!isWrappedEnvironment()) return;

        titleClickCount++;
        clearTimeout(titleClickTimer);

        if (titleClickCount >= 5) {
            titleClickCount = 0;
            const analyzer = document.getElementById('hidden-analyzer');
            if (analyzer) {
                if (analyzer.style.display === 'none' || analyzer.style.display === '') {
                    analyzer.style.display = 'block';
                    pickRandomNextSuit();
                    updateCustomHandDisplay();
                    alert('🔓 Hidden Analyzer Mode Enabled');
                } else {
                    analyzer.style.display = 'none';
                }
            }
        } else {
            titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 2000);
        }
    });
}

/* -------------------------------------------------------------
   히든 분석기 및 퀴즈 로직
------------------------------------------------------------- */
function pickRandomNextSuit() {
    const available = SUITS.filter(s => s.code !== customSuitCode);
    const chosen = available[Math.floor(Math.random() * available.length)];
    customSuitCode = chosen.code;
}

function renderCustomButtons() {
    const grid = document.getElementById('custom-tile-buttons');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-number';
        btn.innerText = `${i}`;
        btn.onclick = () => addCustomTile(i);
        grid.appendChild(btn);
    }
}

function addCustomTile(num) {
    if (customHand.length >= 13) {
        alert('Max 13 tiles');
        return;
    }
    const count = customHand.filter(x => x === num).length;
    if (count >= 4) {
        alert(`Max 4 tiles for (${num})`);
        return;
    }

    customHand.push(num);
    customHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

function applyCustomTextInput() {
    const input = document.getElementById('custom-text-input').value.trim();
    if (!/^[1-9]{1,13}$/.test(input)) {
        alert('Enter 1-9 digits (max 13)');
        return;
    }

    let counts = Array(10).fill(0);
    let newHand = [];
    for (let char of input) {
        let n = parseInt(char);
        counts[n]++;
        if (counts[n] > 4) {
            alert(`Max 4 tiles for (${n})`);
            return;
        }
        newHand.push(n);
    }

    pickRandomNextSuit();
    customHand = newHand.sort((a, b) => a - b);
    updateCustomHandDisplay();
}

async function updateCustomHandDisplay() {
    const container = document.getElementById('custom-hand-container');
    container.innerHTML = '';

    if (customHand.length === 0) {
        container.innerHTML = `<span style="color:#a3b18a; font-size:14px;">${t('analyzerEmptyHint')}</span>`;
        return;
    }

    for (let i = 0; i < customHand.length; i++) {
        const num = customHand[i];
        const img = document.createElement('img');
        img.src = await getTileImageSrc(customSuitCode, num);
        img.className = 'tile-img';
        img.style.cursor = 'pointer';
        img.title = 'Click to remove';
        img.onclick = () => removeCustomTile(i);
        container.appendChild(img);
    }
}

function removeCustomTile(index) {
    customHand.splice(index, 1);
    updateCustomHandDisplay();
}

function clearCustomHand() {
    customHand = [];
    document.getElementById('custom-text-input').value = '';
    document.getElementById('custom-result').style.display = 'none';
    pickRandomNextSuit();
    updateCustomHandDisplay();
}

function analyzeCustomHand() {
    if (customHand.length !== 13) {
        alert(`Hand must contain 13 tiles. (Current: ${customHand.length})`);
        return;
    }

    const resultData = getWinningTiles(customHand);
    const resultDiv = document.getElementById('custom-result');
    resultDiv.style.display = 'block';

    const savedHand = [...currentHand];
    const savedWaits = [...winningTiles];
    const savedMaxed = [...maxedOutWinningTiles];
    const savedDecomps = { ...winningDecompositions };
    const savedChiitoi = isChiitoiHand;
    const savedRyan = isRyanpeikouHand;
    const savedMode = currentMode;

    currentHand = [...customHand];
    winningTiles = resultData.waits;
    maxedOutWinningTiles = resultData.maxedOut;
    winningDecompositions = resultData.decomps;
    isChiitoiHand = resultData.isChiitoi;
    isRyanpeikouHand = resultData.isRyanpeikou;
    currentMode = 'hard'; 

    let actualStr = winningTiles.length > 0 ? winningTiles.join(', ') : '-';
    let tagNotice = '';
    if (isRyanpeikouHand) {
        tagNotice = `<div class="special-tag ryanpeikou-tag">${t('ryanpeikouNotice')}</div><br>`;
    } else if (isChiitoiHand) {
        tagNotice = `<div class="special-tag chiitoi-tag">${t('chiitoiNotice')}</div><br>`;
    }

    let htmlStr = '';
    if (maxedOutWinningTiles.length > 0) {
        const theoreticalList = [...winningTiles, ...maxedOutWinningTiles].sort((a, b) => a - b);
        htmlStr = `${tagNotice}<b>${t('actualWaits')}:</b> [ ${actualStr} ] &nbsp;|&nbsp; <b>${t('theoreticalWaits')}:</b> [ ${theoreticalList.join(', ')} ]<br><small style="color:#d35400;">${t('maxedNotice', { tiles: maxedOutWinningTiles.join(', ') })}</small>`;
    } else {
        htmlStr = `${tagNotice}<b>${t('actualWaits')}:</b> [ ${actualStr} ]`;
    }

    if (winningTiles.length > 0 || maxedOutWinningTiles.length > 0) {
        htmlStr += renderDecompositionExplanation();
        resultDiv.className = 'result-message correct';
    } else {
        resultDiv.className = 'result-message incorrect';
    }

    resultDiv.innerHTML = htmlStr;

    currentHand = savedHand;
    winningTiles = savedWaits;
    maxedOutWinningTiles = savedMaxed;
    winningDecompositions = savedDecomps;
    isChiitoiHand = savedChiitoi;
    isRyanpeikouHand = savedRyan;
    currentMode = savedMode;
}

