/* =============================================================
   📌 글로벌 변수 및 상수 정의 (script_global.js)
   ============================================================= */
const APP_VERSION = window.MAIN_VER || "0.0";

const SUITS = [
    { code: 'Man', name: '만자패' },
    { code: 'Pin', name: '통자패' },
    { code: 'Sou', name: '삭자패' }
];

// 자패(자패 코드 및 표시 이름) 정의
const HONORS = [
    { code: 'Ton', num: 1, name: '동' },
    { code: 'Nan', num: 2, name: '남' },
    { code: 'Sha', num: 3, name: '서' },
    { code: 'Pei', num: 4, name: '북' },
    { code: 'Haku', num: 5, name: '백' },
    { code: 'Hatsu', num: 6, name: '발' },
    { code: 'Chun', num: 7, name: '중' }
];

// 📌 MODE_ID_MAP 상수
const MODE_ID_MAP = {
    'veryEasy': 'mode0',
    'easy': 'mode1',
    'normal': 'mode2',
    'hard': 'mode3',
    'best': 'mode4',
    'discard': 'mode5',
    'streak': 'mode6'
};

// 📌 게임 진행 상태 변수
let currentSuitObj = null;
let currentHand = [];         // 숫자패 (수패 1~9)
let currentHonorHand = [];    // 자패 (혼일색용 자패 목록, 예: [{code:'Ton', count:3}])
let winningTiles = [];
let maxedOutWinningTiles = [];
let winningDecompositions = {}; 
let isChiitoiHand = false;     
let isRyanpeikouHand = false; 
let selectedTiles = new Set();

let currentMode = 'veryEasy'; // 기본 선택 모드를 매우 쉬움으로 배치
let isSubmitted = false;

// 📌 타이머 및 연승(Streak) 변수
let streakCount = 0;
let timerInterval = null;
let timeLeft = 60;
let pendingRecordStreak = 0;

// 🔒 히든 모드 변수
let titleClickCount = 0;
let titleClickTimer = null;
let customHand = [];
let customSuitCode = 'Man';

// 언어 설정
window.currentLang = localStorage.getItem('app_lang') || 'ko';

// 📌 Translation Helper Function (t / translate)
function t(key, params = {}) {
    const lang = window.currentLang || 'ko';
    
    // 키가 'modes.easy'와 같이 점(.)으로 구분되어 전달되는 경우 대응
    const keys = key.split('.');
    let result = TRANSLATIONS[lang] || TRANSLATIONS['ko'];
    
    for (const k of keys) {
        if (result && result[k] !== undefined) {
            result = result[k];
        } else {
            // 해당 언어에 키가 없을 경우 한국어(ko) 기본값 fallback 처리
            let fallback = TRANSLATIONS['ko'];
            for (const fk of keys) {
                if (fallback && fallback[fk] !== undefined) {
                    fallback = fallback[fk];
                } else {
                    return key;
                }
            }
            result = fallback;
            break;
        }
    }

    if (typeof result !== 'string') return key;

    // 파라미터 바인딩 ({count}, {tile} 등)
    Object.keys(params).forEach(pKey => {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
    });

    return result;
}

function translate(key, params = {}) {
    return t(key, params);
}
