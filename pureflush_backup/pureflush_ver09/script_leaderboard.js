/* =============================================================
   📌 LeaderBoard & Apps Script API Manager (script_leaderboard.js)
   ============================================================= */

// ==========================================
// Google Apps Script API 설정
// ==========================================
const GAS_CONFIG = {
    // 1. 배포된 Google Apps Script Web App URL
    apiUrl: "https://script.google.com/macros/s/AKfycbw7IDyRIqGfps_5Yw7az-9_vPXajFKR-rZaCHpFeBA3sVsnExFFmK70cfxr_Der58RJvA/exec",
    // 2. Apps Script의 SECRET_KEY와 동일하게 유지
    secretKey: "Mahjong_Quiz_Secret_Key_2026",
    // 3. 구글 시트 웹 게시 CSV URL
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTnJU4yDCDyeZZCmpkbogFP62WF_AcmsitYv6YBufHxY2qafrzmqXjvOHUrAsGp0sjeK-FBAptasrpq/pub?gid=1559316332&single=true&output=csv"
};

/* -------------------------------------------------------------
   📊 HTML Escape 유틸리티 함수
------------------------------------------------------------- */
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* -------------------------------------------------------------
   📊 타임스탬프 포맷 변환 함수
------------------------------------------------------------- */
function formatTimestamp(rawStr) {
    if (!rawStr) return '-';
    let str = String(rawStr).trim();

    try {
        let isPM = str.includes('오후');
        let cleaned = str.replace(/(오전|오후)/g, '').trim();
        let parts = cleaned.split(/[\s.:-]+/).filter(Boolean);

        if (parts.length >= 3) {
            let year = parts[0];
            let month = String(parts[1]).padStart(2, '0');
            let day = String(parts[2]).padStart(2, '0');
            let hour = parseInt(parts[3] || '0', 10);
            let min = String(parts[4] || '0').padStart(2, '0');
            let sec = String(parts[5] || '0').padStart(2, '0');

            if (isPM && hour < 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;

            let hourStr = String(hour).padStart(2, '0');

            return `${year}-${month}-${day} ${hourStr}:${min}:${sec}`;
        }
    } catch (e) {
        console.warn("Timestamp parsing error:", e);
    }

    return str;
}

/* -------------------------------------------------------------
   📊 HMAC 서명 생성 및 Apps Script 기록 저장 (Write)
------------------------------------------------------------- */
function saveRecord() {
    const inputElem = document.getElementById('player-name-input');
    const saveBtn = document.getElementById('btn-save-record');
    let playerName = inputElem ? inputElem.value.trim() : '';
    
    if (!playerName) {
        playerName = 'Anonymous';
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = '...';
    }

    const timestamp = Date.now();
    // pendingRecordStreak는 메인 스크립트 전역 변수를 참조합니다.
    const streak = typeof pendingRecordStreak !== 'undefined' ? pendingRecordStreak : 0;

    // HMAC 서명 검증 키 생성: Name_Streak_Timestamp
    const rawMessage = `${playerName}_${streak}_${timestamp}`;
    const signature = CryptoJS.HmacSHA256(rawMessage, GAS_CONFIG.secretKey).toString(CryptoJS.enc.Hex);

    const payload = {
        name: playerName,
        streak: streak,
        timestamp: timestamp,
        signature: signature
    };

    console.log('[DEBUG] [saveRecord] Sending payload:', payload);

    // Google Apps Script Web App으로 JSON 데이터 전송
    fetch(GAS_CONFIG.apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8' // GAS CORS 회피 표준 설정
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        console.log('[DEBUG] [saveRecord] HTTP Status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('[DEBUG] [saveRecord] GAS Response:', data);
        if (data.result === 'success') {
            alert(`🎉 ${playerName} (${streak})`);
            const nameContainer = document.getElementById('name-input-container');
            if (nameContainer) nameContainer.style.display = 'none';
            if (inputElem) inputElem.value = '';
            setTimeout(loadLeaderboard, 1500);
        } else {
            alert(`⚠️ ${data.message || 'Error'}`);
        }
    })
    .catch(err => {
        alert('Error');
        console.error('[DEBUG] [saveRecord] Error:', err);
    })
    .finally(() => {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = typeof t === 'function' ? t('btnSaveRecord') : '저장';
        }
    });
}

/* -------------------------------------------------------------
   📊 구글 시트 실시간 리더보드 조회 (Read)
------------------------------------------------------------- */
function loadLeaderboard() {
    console.group('[DEBUG] Leaderboard Loading Process');
    console.log('GAS Config CSV URL:', GAS_CONFIG.csvUrl);

    const recordListUl = document.getElementById('record-list-ul');

    if (!GAS_CONFIG.csvUrl || GAS_CONFIG.csvUrl.includes('YOUR_SHEET_ID')) {
        console.error('[DEBUG] Invalid CSV URL configuration.');
        if (recordListUl) {
            recordListUl.innerHTML = 
                '<li style="text-align:center; padding:10px; color:#e74c3c;">CSV URL Error</li>';
        }
        console.groupEnd();
        return;
    }

    const fetchUrl = `${GAS_CONFIG.csvUrl}&t=${Date.now()}`;
    console.log('Fetching CSV from:', fetchUrl);

    // fetch를 통해 CSV 데이터 수신 후 파싱 진행
    fetch(fetchUrl)
        .then(response => {
            console.log('CSV Fetch HTTP Status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP Error Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            console.log('Raw CSV Data Received (length):', csvText.length);

            Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('PapaParse complete. Total rows:', results.data.length);
                    if (results.errors && results.errors.length > 0) {
                        console.warn('PapaParse warnings/errors:', results.errors);
                    }

                    const rows = results.data;
                    const userRecordsMap = new Map();
                    let filteredRowCount = 0;

                    rows.forEach((row) => {
                        if (!row || row.length < 3) return;

                        let rawTimestamp = String(row[0] || '').trim();
                        let name = String(row[1] || '').trim();
                        let streak = parseInt(row[2], 10);

                        if (
                            rawTimestamp.includes('타임스탬프') || 
                            rawTimestamp.includes('Timestamp') || 
                            name.includes('Name') || 
                            isNaN(streak)
                        ) {
                            return;
                        }

                        if (!name) name = 'Anonymous';

                        if (streak >= 10) {
                            filteredRowCount++;
                            const formattedDate = formatTimestamp(rawTimestamp);
                            const dateOnly = formattedDate.split(' ')[0] || formattedDate;
                            const uniqueKey = `${name}_${dateOnly}`;
                            
                            if (userRecordsMap.has(uniqueKey)) {
                                if (streak > userRecordsMap.get(uniqueKey).streak) {
                                    userRecordsMap.set(uniqueKey, { name, streak, date: formattedDate });
                                }
                            } else {
                                userRecordsMap.set(uniqueKey, { name, streak, date: formattedDate });
                            }
                        }
                    });

                    console.log(`Valid records extracted: ${filteredRowCount}, Unique aggregated: ${userRecordsMap.size}`);

                    let parsedRecords = Array.from(userRecordsMap.values());
                    parsedRecords.sort((a, b) => b.streak - a.streak);

                    const top10 = parsedRecords.slice(0, 10);
                    console.log('Top 10 Records:', top10);

                    const ul = document.getElementById('record-list-ul');
                    if (!ul) {
                        console.error('Element #record-list-ul not found in DOM.');
                        console.groupEnd();
                        return;
                    }

                    ul.innerHTML = '';

                    if (top10.length === 0) {
                        console.warn('No records matched the criteria (streak >= 10).');
                        ul.innerHTML = `<li style="text-align:center; padding: 10px; color:#7f8c8d;">${typeof t === 'function' ? t('hallOfFameLoading') : '기록이 없습니다.'}</li>`;
                        console.groupEnd();
                        return;
                    }

                    top10.forEach((rec, idx) => {
                        const li = document.createElement('li');
                        li.className = 'record-item';
                        li.innerHTML = `
                            <span class="record-rank">${idx + 1}</span>
                            <span class="record-name">${escapeHtml(rec.name)}</span>
                            <span class="record-score">${rec.streak}</span>
                            <span class="record-date" style="font-size: 11px; color: #888; white-space: nowrap;">${rec.date}</span>
                        `;
                        ul.appendChild(li);
                    });

                    console.log('Leaderboard rendered successfully.');
                    console.groupEnd();
                },
                error: function(err) {
                    console.error('PapaParse execution error:', err);
                    if (recordListUl) {
                        recordListUl.innerHTML = 
                            '<li style="text-align:center; padding: 10px; color:#7f8c8d;">Parse Error</li>';
                    }
                    console.groupEnd();
                }
            });
        })
        .catch(err => {
            console.error('Fetch / Network Error:', err);
            if (recordListUl) {
                recordListUl.innerHTML = 
                    '<li style="text-align:center; padding: 10px; color:#7f8c8d;">Network Error</li>';
            }
            console.groupEnd();
        });
}