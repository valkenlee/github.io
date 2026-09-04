/* =============================================================
   📌 글로벌 변수 및 상수 정의 (script_const.js)
   ============================================================= */
const APP_VERSION = window.MAIN_VER || "0.0";

const SUITS = [
    { code: 'Man', name: '만자패' },
    { code: 'Pin', name: '통자패' },
    { code: 'Sou', name: '삭자패' }
];

// 📌 MODE_ID_MAP 상수
const MODE_ID_MAP = {
    'easy': 'mode1',
    'normal': 'mode2',
    'hard': 'mode3',
    'best': 'mode4',
    'discard': 'mode5',
    'streak': 'mode6'
};

// 📌 게임 진행 상태 변수
let currentSuitObj = null;
let currentHand = [];
let winningTiles = [];
let maxedOutWinningTiles = [];
let winningDecompositions = {}; 
let isChiitoiHand = false;     
let isRyanpeikouHand = false; 
let selectedTiles = new Set();

let currentMode = 'normal';
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

