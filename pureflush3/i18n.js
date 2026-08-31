const TRANSLATIONS = {
    ko: {
        title: "청일색 텐파이 대기패 퀴즈",
        loading: "📦 마작패 패키지를 읽어오는 중입니다...",
        loadingSuccess: "✅ 마작패 로딩 완료! 원하시는 모드를 선택하세요.",
        loadingError: "❌ 마작패 로딩 실패! 파일이 같은 폴더에 있는지 확인해 주세요.",
        modeEasy: "🌱 쉬움",
        modeNormal: "🌿 보통",
        modeHard: "🔥 어려움",
        modeStreak: "⚡ 연승 모드",
        hintEasy: "💡 힌트: 총 {count}개의 오름패가 있습니다.",
        streakCount: "🔥 현재 {count}연승 중",
        timerSeconds: "⏱️ {count}초",
        quizInstruction: "오름패(대기패)가 되는 숫자를 모두 선택하세요:",
        shortcutHint: "(단축키: 1~9, Enter)",
        btnSubmit: "제출 및 정답 확인",
        btnNextStreak: "다음 연승 문제로 이동",
        btnNextSame: "같은 난이도로 새 문제 제출",
        btnSaveRecord: "기록 등록",
        hallOfFameTitle: "🏆 연승 모드 글로벌 명예의 전당 (Top 10)",
        hallOfFameSubtitle: "🌐 Google Sheets 연동 글로벌 실시간 리더보드입니다.",
        hallOfFameLoading: "기록을 불러오는 중...",
        congratsStreak: "🏆 축하합니다! 10연승 이상 기록 달성!",
        inputNameNotice: "명예의 전당 등록 이름 (미입력 시 Anonymous):",
        inputNamePlaceholder: "Anonymous (최대 20자)",
        
        // 히든 분석기
        analyzerTitle: "🕵️‍♂️ 히든 패 분석기 (자유 패 입력)",
        analyzerInputLabel: "⌨️ 숫자 직접 입력 (예: 1112345678999):",
        analyzerInputPlaceholder: "숫자 13자리 입력",
        analyzerApplyBtn: "입력 반영",
        analyzerCopyBtn: "문제 복사",
        analyzerEmptyHint: "1~9 패 선택 버튼을 누르거나 숫자를 입력하세요.",
        analyzerClearBtn: "전체 삭제",
        analyzerAnalyzeBtn: "🔍 대기패 및 해설 계산하기",

        // 역/대기 형태 태그 및 용어
        ryanpeikouNotice: "💡 이 문제는 량페코(兩盃口) 형태가 포함된 문제입니다.",
        chiitoiNotice: "💡 이 문제는 청일색과 치또이(七対子)가 조합된 단기대기 문제입니다.",
        waitRyanmen: "양면",
        waitTanki: "단기",
        waitShanpon: "샤보",
        waitKanchan: "간짱",
        waitPenchan: "변짱",
        
        // 결과 메시지
        correct: "🎉 정답입니다!",
        incorrect: "❌ 오답입니다.",
        timeout: "⏰ 시간 초과로 실패했습니다!",
        actualWaits: "실제 오름패",
        theoreticalWaits: "이론상 대기패",
        maxedNotice: "(※ {tiles}번 패는 오름패 형태이지만 4장을 모두 사용 중이어서 완성할 수 없음)",
        
        // 설명 상자
        explanationTitle: "🔍 대기패별 대기 유형 및 손패 구조 해설",
        
        // 모달창
        modalTitle: "⚡ 어려움 연승 모드",
        modalTimeRule: "⏱️ <b>60초 제한시간:</b> 문제당 60초 안에 정답을 맞혀야 합니다.",
        modalHofRule: "🏆 <b>글로벌 명예의 전당:</b> <b>10연승 이상</b>을 기록할 경우 전 세계 리더보드에 저장됩니다.",
        modalNameRule: "✏️ <b>이름 설정:</b> 이름을 입력하지 않으면 <b>Anonymous</b>로 등록됩니다.",
        modalStartBtn: "도전 시작하기",

        descriptions: {
            easy: "📌 <b>🌱 쉬움 모드:</b><br>• 1~2개의 오름패만 존재하는 쉬운 문제이며, 오름패가 몇 개인지도 알려 줍니다.<br>• 제출 후 대기 유형 및 세부 분해 해설을 제공합니다.",
            normal: "📌 <b>🌿 보통 모드:</b><br>• 일반적으로 2개의 오름패인 문제 위주로 출제됩니다.<br>• 제출 후 대기 유형과 세부 분해 해설을 제공합니다.",
            hard: "📌 <b>🔥 어려움 모드:</b><br>• 기본적으로 여러 형태의 다면대기 문제입니다.<br>• 제출 후 다양한 대기 유형과 분해 형태를 모두 분석해 드립니다.",
            streak: "📌 <b>⚡ 어려움 연승 모드 규칙:</b><br>• ⏱️ <b>60초 제한시간:</b> 문제당 60초 안에 정답을 맞혀야 합니다.<br>• ⚡ 별도의 패 분해 해설이 제공되지 않고 빠른 진행을 지원합니다."
        }
    },
    ja: {
        title: "清一色 聴牌 待ち牌クイズ",
        loading: "📦 麻雀牌のリソースを読み込んでいます...",
        loadingSuccess: "✅ 牌の読み込み完了！モードを選択してください。",
        loadingError: "❌ 麻雀牌の読み込み失敗！ファイルが同じフォルダにあるか確認してください。",
        modeEasy: "🌱 初級",
        modeNormal: "🌿 中級",
        modeHard: "🔥 上級",
        modeStreak: "⚡ 連勝モード",
        hintEasy: "💡 ヒント: アガリ牌は全部で {count} 個あります。",
        streakCount: "🔥 現在 {count} 連勝中",
        timerSeconds: "⏱️ {count}秒",
        quizInstruction: "アガリ牌（待ち牌）となる数字をすべて選択してください:",
        shortcutHint: "(ショートカット: 1~9, Enter)",
        btnSubmit: "回答する",
        btnNextStreak: "次の問題へ",
        btnNextSame: "同じ難易度で再挑戦",
        btnSaveRecord: "記録を登録",
        hallOfFameTitle: "🏆 連勝モード グローバル殿堂 (Top 10)",
        hallOfFameSubtitle: "🌐 Google スプレッドシート連携のリアルタイムリーダーボードです。",
        hallOfFameLoading: "記録を読み込んでいます...",
        congratsStreak: "🏆 おめでとうございます！10連勝以上達成！",
        inputNameNotice: "殿堂入り登録名 (未入力の場合は Anonymous):",
        inputNamePlaceholder: "Anonymous (最大20文字)",
        
        analyzerTitle: "🕵️‍♂️ 手牌アナライザー（自由入力）",
        analyzerInputLabel: "⌨️ 数字直接入力 (例: 1112345678999):",
        analyzerInputPlaceholder: "数字13桁を入力",
        analyzerApplyBtn: "反映",
        analyzerCopyBtn: "問題をコピー",
        analyzerEmptyHint: "1〜9のボタンを押すか、数字を入力してください。",
        analyzerClearBtn: "すべて消去",
        analyzerAnalyzeBtn: "🔍 待ち牌と解説を計算",

        ryanpeikouNotice: "💡 二盃口（リャンペーコー）の形が含まれている問題です。",
        chiitoiNotice: "💡 清一色と七対子（チートイツ）が複合した単騎待ち問題です。",
        waitRyanmen: "両面",
        waitTanki: "単騎",
        waitShanpon: "シャボ",
        waitKanchan: "カンチャン",
        waitPenchan: "ペンチャン",
        
        correct: "🎉 正解です！",
        incorrect: "❌ 不正解です。",
        timeout: "⏰ 制限時間切れです！",
        actualWaits: "実際のアガリ牌",
        theoreticalWaits: "理論上の待ち牌",
        maxedNotice: "(※ {tiles} は手牌で4枚使用中のためアガれません)",
        
        explanationTitle: "🔍 待ち牌ごとの待ち形・手牌構成の解説",
        
        modalTitle: "⚡ 上級 連勝モード",
        modalTimeRule: "⏱️ <b>60秒制限:</b> 1問につき60秒以内に回答してください。",
        modalHofRule: "🏆 <b>殿堂入り:</b> <b>10連勝以上</b>でグローバルリーダーボードに記録されます。",
        modalNameRule: "✏️ <b>名前設定:</b> 未入力の場合は <b>Anonymous</b> として登録されます。",
        modalStartBtn: "挑戦を開始する",

        descriptions: {
            easy: "📌 <b>🌱 初級モード:</b><br>• アガリ牌が1〜2個の簡単な問題です。待ち牌の数も表示されます。<br>• 回答後に待ちの形と詳細な解説が表示されます。",
            normal: "📌 <b>🌿 中級モード:</b><br>• 主に2つ待ちを中心とした問題が出題されます。<br>• 回答後に待ちの形と詳細な解説が表示されます。",
            hard: "📌 <b>🔥 上級モード:</b><br>• 複雑な多面張（多面待ち）問題が出題されます。<br>• 回答後に多様な待ちの形と分解パターンをすべて解説します。",
            streak: "📌 <b>⚡ 連勝モードルール:</b><br>• ⏱️ <b>60秒制限:</b> 1問につき60秒以内に回答してください。<br>• ⚡ 解説は表示されず、テンポ重視のモードです。"
        }
    },
    zh_CN: {
        title: "清一色 听牌 听什么 猜谜",
        loading: "📦 正在加载麻将牌资源...",
        loadingSuccess: "✅ 麻将牌加载完成！请选择游戏模式。",
        loadingError: "❌ 麻将牌加载失败！请检查文件是否在同一目录下。",
        modeEasy: "🌱 简单",
        modeNormal: "🌿 普通",
        modeHard: "🔥 困难",
        modeStreak: "⚡ 连胜模式",
        hintEasy: "💡 提示: 共有 {count} 个和牌（听牌）。",
        streakCount: "🔥 当前 {count} 连胜",
        timerSeconds: "⏱️ {count}秒",
        quizInstruction: "请选择所有可以和牌（听牌）的数字:",
        shortcutHint: "(快捷键: 1~9, Enter)",
        btnSubmit: "提交并查看答案",
        btnNextStreak: "进入下一题",
        btnNextSame: "同难度再来一题",
        btnSaveRecord: "提交成绩",
        hallOfFameTitle: "🏆 连胜模式 全球名人堂 (Top 10)",
        hallOfFameSubtitle: "🌐 基于 Google Sheets 绑定的实时全球排行榜。",
        hallOfFameLoading: "正在加载纪录...",
        congratsStreak: "🏆 恭喜！达成 10 连胜以上纪录！",
        inputNameNotice: "名人堂登记名称 (未输入时为 Anonymous):",
        inputNamePlaceholder: "Anonymous (最多20字)",
        
        analyzerTitle: "🕵️‍♂️ 隐藏手牌分析器（自由输入）",
        analyzerInputLabel: "⌨️ 直接输入数字 (例: 1112345678999):",
        analyzerInputPlaceholder: "输入13位数字",
        analyzerApplyBtn: "应用",
        analyzerCopyBtn: "复制题目",
        analyzerEmptyHint: "请点击1~9按钮或输入数字。",
        analyzerClearBtn: "全部清除",
        analyzerAnalyzeBtn: "🔍 计算听牌与解析",

        ryanpeikouNotice: "💡 本题包含两杯口牌型。",
        chiitoiNotice: "💡 本题为清一色与七对子复合的单骑听牌。",
        waitRyanmen: "两面",
        waitTanki: "单骑",
        waitShanpon: "双碰",
        waitKanchan: "嵌张",
        waitPenchan: "边张",
        
        correct: "🎉 回答正确！",
        incorrect: "❌ 回答错误。",
        timeout: "⏰ 时间到！",
        actualWaits: "实际和牌",
        theoreticalWaits: "理论听牌",
        maxedNotice: "(※ {tiles} 已经被手牌使用4张，无法完成和牌)",
        
        explanationTitle: "🔍 各听牌类型及手牌结构解析",
        
        modalTitle: "⚡ 困难 连胜模式",
        modalTimeRule: "⏱️ <b>60秒限时:</b> 每题须在60秒内完成。",
        modalHofRule: "🏆 <b>全球名人堂:</b> 达到 <b>10连胜以上</b> 即可登榜。",
        modalNameRule: "✏️ <b>玩家名称:</b> 未输入时默认显示为 <b>Anonymous</b>。",
        modalStartBtn: "开始挑战",

        descriptions: {
            easy: "📌 <b>🌱 简单模式:</b><br>• 仅有 1~2 个和牌的简单题目，并提示和牌数量。<br>• 提交后提供听牌类型及详细拆解说明。",
            normal: "📌 <b>🌿 普通模式:</b><br>• 以 2 个和牌为主的常见听牌型。<br>• 提交后提供听牌类型及详细拆解说明。",
            hard: "📌 <b>🔥 困难模式:</b><br>• 复杂的多面听牌型。<br>• 提交后分析所有可能组合与听牌类型。",
            streak: "📌 <b>⚡ 连胜模式规则:</b><br>• ⏱️ <b>60秒限时:</b> 每题须在60秒内完成。<br>• ⚡ 不提供手牌拆解，方便快速挑战。"
        }
    },
    zh_TW: {
        title: "清一色 聽牌 聽什麼 猜謎",
        loading: "📦 正在載入麻將牌資源...",
        loadingSuccess: "✅ 麻將牌載入完成！請選擇遊戲模式。",
        loadingError: "❌ 麻將牌載入失敗！請確認檔案是否在同一資料夾。",
        modeEasy: "🌱 簡單",
        modeNormal: "🌿 普通",
        modeHard: "🔥 困難",
        modeStreak: "⚡ 連勝模式",
        hintEasy: "💡 提示: 共有 {count} 個胡牌（聽牌）。",
        streakCount: "🔥 當前 {count} 連勝",
        timerSeconds: "⏱️ {count}秒",
        quizInstruction: "請選擇所有可以胡牌（聽牌）的數字:",
        shortcutHint: "(快捷鍵: 1~9, Enter)",
        btnSubmit: "提交並確認答案",
        btnNextStreak: "進入下一題",
        btnNextSame: "同難度再挑戰一題",
        btnSaveRecord: "送出紀錄",
        hallOfFameTitle: "🏆 連勝模式 全球名人堂 (Top 10)",
        hallOfFameSubtitle: "🌐 基於 Google Sheets 連結的即時全球排行榜。",
        hallOfFameLoading: "正在載入紀錄...",
        congratsStreak: "🏆 恭喜！達成 10 連勝以上紀錄！",
        inputNameNotice: "名人堂登記名稱 (未輸入時為 Anonymous):",
        inputNamePlaceholder: "Anonymous (最多20字)",
        
        analyzerTitle: "🕵️‍♂️ 隱藏手牌分析器（自由輸入）",
        analyzerInputLabel: "⌨️ 直接輸入數字 (例: 1112345678999):",
        analyzerInputPlaceholder: "輸入13位數字",
        analyzerApplyBtn: "套用",
        analyzerCopyBtn: "複製題目",
        analyzerEmptyHint: "請點擊1~9按鈕或輸入數字。",
        analyzerClearBtn: "全部清除",
        analyzerAnalyzeBtn: "🔍 計算聽牌與解析",

        ryanpeikouNotice: "💡 本題包含兩盃口牌型。",
        chiitoiNotice: "💡 本題為清一色與七對子複合的單騎聽牌。",
        waitRyanmen: "兩面",
        waitTanki: "單騎",
        waitShanpon: "雙碰",
        waitKanchan: "嵌張",
        waitPenchan: "邊張",
        
        correct: "🎉 回答正確！",
        incorrect: "❌ 回答錯誤。",
        timeout: "⏰ 時間到！",
        actualWaits: "實際胡牌",
        theoreticalWaits: "理論聽牌",
        maxedNotice: "(※ {tiles} 已經在手牌中使用4張，無法完成胡牌)",
        
        explanationTitle: "🔍 各聽牌類型及手牌結構解析",
        
        modalTitle: "⚡ 困難 連勝模式",
        modalTimeRule: "⏱️ <b>60秒限時:</b> 每題須在60秒內完成。",
        modalHofRule: "🏆 <b>全球名人堂:</b> 達到 <b>10連勝以上</b> 即可登榜。",
        modalNameRule: "✏️ <b>玩家名稱:</b> 未輸入時預設顯示為 <b>Anonymous</b>。",
        modalStartBtn: "開始挑戰",

        descriptions: {
            easy: "📌 <b>🌱 簡單模式:</b><br>• 僅有 1~2 個胡牌的簡單題目，並提示胡牌數量。<br>• 提交後提供聽牌類型及詳細拆分說明。",
            normal: "📌 <b>🌿 普通模式:</b><br>• 以 2 個胡牌為主的常見聽牌型。<br>• 提交後提供詳細拆分說明。",
            hard: "📌 <b>🔥 困難模式:</b><br>• 複雜的多面聽牌型。<br>• 提交後分析所有可能組合與聽牌類型。",
            streak: "📌 <b>⚡ 連勝模式規則:</b><br>• ⏱️ <b>60秒限時:</b> 每題須在60秒內完成。<br>• ⚡ 不提供手牌拆分，方便快速挑戰。"
        }
    },
    en: {
        title: "Chinitsu Tenpai Waiting Tile Quiz",
        loading: "📦 Loading Mahjong tile resources...",
        loadingSuccess: "✅ Tile resources loaded! Select a game mode.",
        loadingError: "❌ Failed to load Mahjong tiles! Check if files are in the same folder.",
        modeEasy: "🌱 Easy",
        modeNormal: "🌿 Normal",
        modeHard: "🔥 Hard",
        modeStreak: "⚡ Streak Mode",
        hintEasy: "💡 Hint: There are {count} winning tile(s).",
        streakCount: "🔥 Current Streak: {count}",
        timerSeconds: "⏱️ {count}s",
        quizInstruction: "Select all tile numbers that complete the hand:",
        shortcutHint: "(Shortcuts: 1-9, Enter)",
        btnSubmit: "Submit Answer",
        btnNextStreak: "Next Challenge",
        btnNextSame: "Try Another Question",
        btnSaveRecord: "Submit Score",
        hallOfFameTitle: "🏆 Global Hall of Fame (Top 10)",
        hallOfFameSubtitle: "🌐 Live global leaderboard synced via Google Sheets.",
        hallOfFameLoading: "Loading records...",
        congratsStreak: "🏆 Congratulations! You achieved a 10+ win streak!",
        inputNameNotice: "Leaderboard display name (Default: Anonymous):",
        inputNamePlaceholder: "Anonymous(Max 20 ch)",
        
        analyzerTitle: "🕵️‍♂️ Hidden Analyzer (Custom Hand Input)",
        analyzerInputLabel: "⌨️ Direct Number Input (e.g. 1112345678999):",
        analyzerInputPlaceholder: "Enter 13 digits",
        analyzerApplyBtn: "Apply",
        analyzerCopyBtn: "Copy Quiz",
        analyzerEmptyHint: "Select 1-9 buttons or enter numbers.",
        analyzerClearBtn: "Clear All",
        analyzerAnalyzeBtn: "🔍 Analyze Wait Tiles & Breakdown",

        ryanpeikouNotice: "💡 This hand contains a Ryanpeikou (Two Double Pungs) pattern.",
        chiitoiNotice: "💡 This hand is a combination of Chinitsu and Chiitoitsu (Seven Pairs) Tanki wait.",
        waitRyanmen: "Ryanmen (Two-sided)",
        waitTanki: "Tanki (Single)",
        waitShanpon: "Shanpon (Dual-pair)",
        waitKanchan: "Kanchan (Closed)",
        waitPenchan: "Penchan (Edge)",
        
        correct: "🎉 Correct!",
        incorrect: "❌ Incorrect.",
        timeout: "⏰ Time's up!",
        actualWaits: "Winning Tiles",
        theoreticalWaits: "Theoretical Waits",
        maxedNotice: "(※ Tile {tiles} is maxed out with 4 copies in hand, so it cannot complete the hand)",
        
        explanationTitle: "🔍 Decomposition & Wait Analysis",
        
        modalTitle: "⚡ Hard Streak Mode",
        modalTimeRule: "⏱️ <b>60s Timer:</b> Solve each puzzle within 60 seconds.",
        modalHofRule: "🏆 <b>Hall of Fame:</b> Reaching a <b>10+ streak</b> registers you on the leaderboard.",
        modalNameRule: "✏️ <b>Name Option:</b> Leaving it blank registers as <b>Anonymous</b>.",
        modalStartBtn: "Start Challenge",

        descriptions: {
            easy: "📌 <b>🌱 Easy Mode:</b><br>• Simple hands with 1-2 winning tiles. Displays the tile count hint.<br>• Provides detailed hand decompositions and wait types after submission.",
            normal: "📌 <b>🌿 Normal Mode:</b><br>• Standard hands, mostly with 2 winning tiles.<br>• Provides detailed hand decompositions and wait types after submission.",
            hard: "📌 <b>🔥 Hard Mode:</b><br>• Complex multi-sided waits.<br>• Provides full structural decompositions and wait type analysis.",
            streak: "📌 <b>⚡ Streak Mode Rules:</b><br>• ⏱️ <b>60s Time Limit:</b> Solve each puzzle within 60 seconds.<br>• ⚡ Fast-paced mode with no explanations provided."
        }
    }
};

let currentLang = localStorage.getItem('app_lang') || 'ko';

function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    applyTranslations();
    if (typeof updateModeUI === 'function') updateModeUI();
}

function t(key, params = {}) {
    let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['ko']?.[key] || key;
    Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
    });
    return text;
}

function applyTranslations() {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
