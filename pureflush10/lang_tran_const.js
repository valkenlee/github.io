const TRANSLATIONS = {
    ko: {
        title: "청일색 텐파이 대기패 퀴즈",
        loading: "📦 마작패 패키지를 읽어오는 중입니다...",
        loadingSuccess: "✅ 마작패 로딩 완료! 원하시는 모드를 선택하세요.",
        loadingError: "❌ 마작패 로딩 실패! 파일이 같은 폴더에 있는지 확인해 주세요.",
        hintEasy: "💡 힌트: 총 {count}개의 오름패가 있습니다.",

        // 🎮 게임 모드 이름
        modes: {
            veryEasy: "🌱 매우 쉬움 (혼일색)",
            easy: "🌱 쉬움",
            normal: "🌿 보통",
            hard: "🔥 어려움",
            streak: "⚡ 연승 모드",
            best: "🏆 최고의 오름패",
            discard: "🀄 무엇을 버릴까?"
        },

        // 📌 모드 상세 설명 (descriptions)
        descriptions: {
            veryEasy: "📌 <b>매우 쉬움 모드 (혼일색):</b><br>• 자패(동/서/남/북/백/발/중) 커츠가 1~2개 포함된 혼일색 텐파이 형태입니다.<br>• 수패 수가 7~10장으로 적어 손쉽게 오름패 분석을 연습할 수 있습니다.",
            easy: "📌 <b>🌱 쉬움 모드:</b><br>• 1~2개의 오름패만 존재하는 쉬운 문제이며, 오름패가 몇 개인지도 알려 줍니다.<br>• 제출 후 대기 유형 및 세부 분해 해설을 제공합니다.",
            normal: "📌 <b>🌿 보통 모드:</b><br>• 일반적으로 2개의 오름패인 문제 위주로 출제됩니다.<br>• 제출 후 대기 유형과 세부 분해 해설을 제공합니다.",
            hard: "📌 <b>🔥 어려움 모드:</b><br>• 기본적으로 여러 형태의 다면대기 문제입니다.<br>• 제출 후 다양한 대기 유형과 분해 형태를 모두 분석해 드립니다.",
            streak: "📌 <b>⚡ 어려움 연승 모드:</b><br>• ⏱️ <b>60초 제한시간:</b> 문제당 60초 안에 정답을 맞혀야 합니다.<br>• 🏆 <b>글로벌 명예의 전당:</b> 10연승 이상 달성 시 전 세계 리더보드에 저장됩니다.<br>• ✏️ <b>이름 설정:</b> 이름 미입력 시 Anonymous로 등록됩니다.",
            best: "📌 <b>🏆 최고의 오름패 모드:</b><br>• 오름패 중 가장 높은 판수(역)를 만드는 패를 맞히는 모드입니다.<br>• '리치'와 '멘젠쯔모'를 가정하지만, 도라, 적도라는 무시합니다.<br>• 동점인 패가 여러 개일 경우, 그중 하나만 맞혀도 정답입니다.<br>• 제출 후 1~9 오름패별 판수 상세 분석 리포트를 제공합니다.",
            discard: "📌 <b>🀄 무엇을 버릴까? 모드:</b><br>• 14장의 손패(13장 + 새로 가져온 쯔모패)에서 버렸을 때 텐파이가 되며, 대기패의 매수가 가장 많은 <b>최선의 버림패</b>를 선택하는 모드입니다.<br>• 역(판수)를 손해보더라도 대기패를 많게 하는 것을 고르십시오.<br>• 혹시 '역만 텐파이'를 기대할 수 있다면 그것을 선택해도 좋습니다.<br>• 제출 후 버림패별 대기패 목록 및 수량 분석 리포트를 제공합니다."
        },

        // 🔘 공통 버튼 & 인터페이스
        buttons: {
            startGame: "🎮 게임 시작하기",
            submit: "제출 및 정답 확인",
            nextStreak: "다음 연승 문제로 이동",
            nextSame: "같은 난이도로 새 문제 제출",
            saveRecord: "기록 등록",
            shareProblem: "문제 공유",
            copy: "복사",
            apply: "적용",
            clear: "전체 삭제",
            close: "닫기"
        },

        // 🔗 문제 공유 & URL 처리
        share: {
            copiedNotice: "🔗 문제 공유 링크가 클립보드에 복사되었습니다!",
            invalidUrlParam: "⚠️ 올바르지 않은 문제 URL 파라미터 형식입니다.\n입력값(패 개수 및 숫자 범위)을 확인해주세요.",
            loadedFromUrl: "🔗 외부 공유 링크에서 문제를 성공적으로 로드했습니다."
        },

        // 🎯 퀴즈 안내 지시문
        quizInstruction: {
            default: "오름패(대기패)를 <span style=\"color: red;\">모두 선택</span>하세요:",
            best: "오름패(대기패)를 <span style=\"color: red;\">하나만</span> 선택하세요:",
            discard: "버릴 패를 <span style=\"color: red;\">하나만</span> 선택하세요:",
            shortcut: "(단축키: 1~9, Enter)"
        },

        // 📊 나의 게임 기록 (stats)
        stats: {
            title: "📊 나의 게임 기록",
            mode: "게임 모드",
            plays: "게임 횟수",
            correct: "맞춤",
            wrong: "틀림",
            unsubmitted: "미제출",
            rate1: "정답률1",
            rate2: "정답률2",
            maxScore: "최고 기록",
            btnChangeId: "PID 변경",
            btnResetStats: "기록 삭제",
            btnClose: "닫기",
            confirmReset: "정말로 모든 게임 기록을 삭제하시겠습니까?"
        },

        // 🔍 손패 확대/줄바꿈 조작
        zoomctrl: {
            zoomOut: "🔍- 축소",
            zoomIn: "🔍+ 확대",
            lineToggle: "줄 바꿈 (1줄/2줄)",
            reset: "초기화 🔄"
        },

        // 🕵️‍♂️ 히든 패 분석기 (analyzer)
        analyzer: {
            title: "🕵️‍♂️ 히든 패 분석기 (자유 패 입력)",
            inputLabel: "⌨️ 숫자 직접 입력 (예: 1112345678999):",
            inputPlaceholder: "숫자 13자리 입력",
            applyBtn: "입력 반영",
            copyBtn: "문제 복사",
            emptyHint: "1~9 패 선택 버튼을 누르거나 숫자를 입력하세요.",
            clearBtn: "전체 삭제",
            analyzeBtn: "🔍 대기패 및 해설 계산하기"
        },

        // 🀄 역(Yaku) 정의
        yaku: {
            chinitsu: "청일색",
            reach: "리치",
            tsumo: "멘젠쯔모",
            tanyao: "탕야오",
            pinfu: "핑후",
            iipeikou: "이페코",
            ittsu: "일기통관",
            junchan: "준찬타",
            chiitoi: "치또이츠",
            ryanpeikou: "량페코",
            toitoi: "또이또이",
            sanankou: "삼암각",
            suuankou: "사암각",
            suuankouTanki: "사암각 단기",
            chuuren: "구련보등",
            junseiChuuren: "순정구련보등",
            ryuuisou: "녹일색",
            chinroto: "청로두"
        },

        // 📊 최고의 오름패 / 버림패 분석 리포트
        bestReport: {
            headerTitle: "1~9 오름패 판수 상세 분석 리포트",
            condition: "(조건: 리치 1판 + 멘젠쯔모 1판 기본 적용)",
            yakumanTenpaiAlert: "역만 텐파이 상태입니다! ({yaku})", // 👈 추가
            optimalChoice: "[최적의 선택]",
            yakumanFormat: "{count}배 역만",
            yakuman: "역만",
            han: "{count}판",
            invalid4Tiles: "0판 [오답: 이미 손패에 4장 존재]",
            invalidNoYaku: "0판 [오답: 역 미성립]",
            labelBest: "🏆 [최고 정답]",
            labelValid: "⭕ [화료 가능]",
            labelInvalid: "❌ [화료 불가]",
            errInvalidHand: "올바르지 않은 손패 또는 오름패 입력입니다.",
            errMax4Tiles: "동일한 패가 4개를 초과할 수 없습니다.",
            errNotChinitsu: "청일색 화료패가 아닙니다 (오름패 불일치 또는 텐파이 아님).",
            correctMsg: "선택하신 [{tile}]번 패는 최고의 판수(<b>{score}</b>)를 만드는 최적의 패입니다!",
            incorrectMsg: "선택하신 [{tile}]번 패는 최고 판수가 아닙니다.<br>👉 가장 높은 판수를 얻는 패: <b>[ {bestTiles} ]</b> ({score})"
        },

        // 🏆 명예의 전당 / 연승 모드 모달
        hallOfFame: {
            title: "🏆 연승 모드 글로벌 명예의 전당 (Top 10)",
            subtitle: "🌐 Google Sheets 연동 글로벌 실시간 리더보드입니다.",
            loading: "기록을 불러오는 중...",
            congrats: "🏆 축하합니다! 10연승 이상 기록 달성!",
            inputNotice: "명예의 전당 등록 이름 (미입력 시 Anonymous):",
            inputPlaceholder: "Anonymous (최대 20자)"
        },
        modal: {
            title: "⚡ 어려움 연승 모드",
            timeRule: "⏱️ <b>60초 제한시간:</b> 문제당 60초 안에 정답을 맞혀야 합니다.",
            hofRule: "🏆 <b>글로벌 명예의 전당:</b> <b>10연승 이상</b>을 기록할 경우 전 세계 리더보드에 저장됩니다.",
            nameRule: "✏️ <b>이름 설정:</b> 이름을 입력하지 않으면 <b>Anonymous</b>로 등록됩니다.",
            startBtn: "도전 시작하기"
        },

        // 💡 역 / 대기 형태 안내 및 결과
        waits: {
            ryanmen: "양면",
            tanki: "단기",
            shanpon: "샤보",
            kanchan: "간짱",
            penchan: "변짱",
            ryanpeikouNotice: "💡 이 문제는 량페코(兩盃口) 형태가 포함된 문제입니다.",
            chiitoiNotice: "💡 이 문제는 청일색과 치또이(七対子)가 조합된 단기대기 문제입니다."
        },

        // 🎉 정답 / 오답 메시지
        result: {
            correct: "🎉 정답입니다!",
            incorrect: "❌ 오답입니다.",
            timeout: "⏰ 시간 초과로 실패했습니다!",
            actualWaits: "실제 오름패",
            theoreticalWaits: "이론상 대기패",
            maxedNotice: "(※ {tiles}번 패는 오름패 형태이지만 4장을 모두 사용 중이어서 완성할 수 없음)",
            alertSelectTile: "오름패를 최소 1개 이상 선택해 주세요."
        }
    },
    ja: {
        title: "清一色 聴牌 待ち牌クイズ",
        loading: "📦 麻雀牌のリソースを読み込んでいます...",
        loadingSuccess: "✅ 牌の読み込み完了！モードを選択してください。",
        loadingError: "❌ 麻雀牌の読み込み失敗！ファイルが同じフォルダにあるか確認してください。",
        hintEasy: "💡 ヒント: アガリ牌は全部で {count} 個あります。",

        modes: {
            veryEasy: "🌱 入門 (混一色)",
            easy: "🌱 初級",
            normal: "🌿 中級",
            hard: "🔥 上級",
            streak: "⚡ 連勝モード",
            best: "🏆 最高のアガリ牌",
            discard: "🀄 何を切る？"
        },

        descriptions: {
            veryEasy: "📌 <b>入門モード (混一色):</b><br>• 字牌(東/南/西/北/白/發/中)の刻子が1〜2個含まれた混一色のテンパイ形です。<br>• 数牌が7〜10枚と少ないため、手軽に待ち牌分析の練習ができます。",
            easy: "📌 <b>🌱 初級モード:</b><br>• アガリ牌が1〜2個の簡単な問題です。待ち牌の数も表示されます。<br>• 回答後に待ちの形と詳細な解説が表示されます。",
            normal: "📌 <b>🌿 中級モード:</b><br>• 主に2つ待ちを中心とした問題が出題されます。<br>• 回答後に待ちの形と詳細な解説が表示されます。",
            hard: "📌 <b>🔥 上級モード:</b><br>• 複雑な多面張（多面待ち）問題が出題されます。<br>• 回答後に様々な待ちの形と分解パターンを解説します。",
            streak: "📌 <b>⚡ 上級 連勝モード:</b><br>• ⏱️ <b>60秒制限:</b> 1問につき60秒以内に回答してください。<br>• 🏆 <b>グローバル殿堂:</b> 10連勝以上達成時に世界リーダーボードへ保存されます。<br>• ✏️ <b>名前設定:</b> 未入力の場合は Anonymous として登録されます。",
            best: "📌 <b>🏆 最高アガリ牌モード:</b><br>• アガリ牌の中で最も翻数（役）が高くなる牌を当てるモードです。<br>• 「リーチ」と「門前清自摸和」を仮定しますが、ドラ・赤ドラは無視します。<br>• 同点の牌が複数ある場合は、どれを選んでも正解となります。<br>• 提出後、1〜9のアガリ牌ごとの翻数詳細分析レポートを提供します。",
            discard: "📌 <b>🀄 何を切る？モード:</b><br>• 14枚の手牌（13枚 + ツモ牌）から切った時にテンパイとなり、受け入れ（待ち牌の枚数）が最も多くなる<b>最善の切牌</b>を選択するモードです。<br>• 打点（翻数）を損にしてでも受け入れ枚数を最大化する牌を選んでください。<br>• もし「役満テンパイ」が狙える場合は、そちらを選んでも正解となります。<br>• 提出後、切牌ごとの待ち牌一覧および枚数分析レポートを提供します。"
        },

        buttons: {
            startGame: "🎮 ゲームを開始する",
            submit: "回答",
            nextStreak: "次の問題へ",
            nextSame: "同じ難易度で再挑戦",
            saveRecord: "記録を登録",
            shareProblem: "問題を共有",
            copy: "コピー",
            apply: "反映",
            clear: "すべて消去",
            close: "閉じる"
        },

        share: {
            copiedNotice: "🔗 問題共有リンクがクリップボードにコピーされました！",
            invalidUrlParam: "⚠️ 不正なURLパラメータ形式です。\n入力値（牌の数および数字の範囲）を確認してください。",
            loadedFromUrl: "🔗 共有リンクから問題を正常に読み込みました。"
        },

        quizInstruction: {
            default: "アガリ牌（待ち牌）となる数字を<span style=\"color: red;\">すべて選択</span>してください:",
            best: "アガリ牌となる数字を<span style=\"color: red;\">1つだけ</span>選んでください:",
            discard: "打牌（捨てる牌）を<span style=\"color: red;\">1つだけ</span>選んでください:",
            shortcut: "(ショートカット: 1~9, Enter)"
        },

        stats: {
            title: "📊 個人戦績",
            mode: "ゲームモード",
            plays: "プレイ回数",
            correct: "正解",
            wrong: "不正解",
            unsubmitted: "未提出",
            rate1: "正解率1",
            rate2: "正解率2",
            maxScore: "最高記録",
            btnChangeId: "PID変更",
            btnResetStats: "記録削除",
            btnClose: "閉じる",
            confirmReset: "本当にすべてのゲーム記録を削除しますか？"
        },

        zoomctrl: {
            zoomOut: "🔍- 縮小",
            zoomIn: "🔍+ 拡大",
            lineToggle: "折り返し (1行/2行)",
            reset: "リセット 🔄"
        },

        analyzer: {
            title: "🕵️‍♂️ 手牌アナライザー（自由入力）",
            inputLabel: "⌨️ 数字直接入力 (例: 1112345678999):",
            inputPlaceholder: "数字13桁を入力",
            applyBtn: "反映",
            copyBtn: "問題をコピー",
            emptyHint: "1〜9のボタンを押すか、数字を入力してください。",
            clearBtn: "すべて消去",
            analyzeBtn: "🔍 待ち牌と解説を計算"
        },

        yaku: {
            chinitsu: "清一色",
            reach: "リーチ",
            tsumo: "門前清自摸和",
            tanyao: "断幺九",
            pinfu: "平和",
            iipeikou: "一盃口",
            ittsu: "一気通貫",
            junchan: "純全帯幺九",
            chiitoi: "七対子",
            ryanpeikou: "二盃口",
            toitoi: "対々和",
            sanankou: "三暗刻",
            suuankou: "四暗刻",
            suuankouTanki: "四暗刻単騎",
            chuuren: "九蓮宝燈",
            junseiChuuren: "純正九蓮宝燈",
            ryuuisou: "緑一色",
            chinroto: "清老頭"
        },

        bestReport: {
            headerTitle: "1~9 アガリ牌 翻数詳細分析レポート",
            condition: "(条件: リーチ1翻 + 門前清自摸和1翻 基本適用)",
            yakumanTenpaiAlert: "役満テンパイ状態です！ ({yaku})", // 👈 추가
            optimalChoice: "[最適な選択]",
            yakumanFormat: "{count}倍役満",
            yakuman: "役満",
            han: "{count}翻",
            invalid4Tiles: "0翻 [不正解: 手牌に4枚使用中]",
            invalidNoYaku: "0翻 [不正解: 役なし]",
            labelBest: "🏆 [最高正解]",
            labelValid: "⭕ [和了可能]",
            labelInvalid: "❌ [和了不可]",
            errInvalidHand: "不正な手牌またはアガリ牌の入力です。",
            errMax4Tiles: "同じ牌を4枚を超えて使用することはできません。",
            errNotChinitsu: "清一色の和了牌ではありません。",
            correctMsg: "選択した [{tile}] 番の牌は最高翻数(<b>{score}</b>)を作る最適な牌です！",
            incorrectMsg: "選択した [{tile}] 番の牌は最高翻数ではありません。<br>👉 最も高い翻数を得られる牌: <b>[ {bestTiles} ]</b> ({score})"
        },

        hallOfFame: {
            title: "🏆 連勝モード グローバル殿堂 (Top 10)",
            subtitle: "🌐 Google スプレッドシート連携のリアルタイムリーダーボードです。",
            loading: "記録を読み込んでいます...",
            congrats: "🏆 おめでとうございます！10連勝以上達成！",
            inputNotice: "殿堂入り登録名 (未入力の場合は Anonymous):",
            inputPlaceholder: "Anonymous (最大20文字)"
        },
        modal: {
            title: "⚡ 上級 連勝モード",
            timeRule: "⏱️ <b>60秒制限:</b> 1問につき60秒以内に回答してください。",
            hofRule: "🏆 <b>殿堂入り:</b> <b>10連勝以上</b>でグローバルリーダーボードに記録されます。",
            nameRule: "✏️ <b>名前設定:</b> 未入力の場合は <b>Anonymous</b> として登録されます。",
            startBtn: "挑戦を開始する"
        },

        waits: {
            ryanmen: "両面",
            tanki: "単騎",
            shanpon: "シャボ",
            kanchan: "カンチャン",
            penchan: "ペンチャン",
            ryanpeikouNotice: "💡 二盃口（リャンペーコー）の形が含まれている問題です。",
            chiitoiNotice: "💡 清一色と七対子（チートイツ）が複合した単騎待ち問題です。"
        },

        result: {
            correct: "🎉 正解です！",
            incorrect: "❌ 不正解です。",
            timeout: "⏰ 制限時間切れです！",
            actualWaits: "実際のアガリ牌",
            theoreticalWaits: "理論上の待ち牌",
            maxedNotice: "(※ {tiles} は手牌で4枚使用中のためアガれません)",
            alertSelectTile: "アガリ牌を少なくとも1つ選択してください。"
        }
    },
    zh_CN: {
        title: "清一色 听牌 猜谜",
        loading: "📦 正在加载麻将牌资源...",
        loadingSuccess: "✅ 麻将牌加载完成！请选择游戏模式。",
        loadingError: "❌ 麻将牌加载失败！请检查文件是否在同一目录下。",
        hintEasy: "💡 提示: 共有 {count} 个和牌（听牌）。",

        modes: {
            veryEasy: "🌱 入门 (混一色)",
            easy: "🌱 简单",
            normal: "🌾 普通",
            hard: "🔥 困难",
            streak: "⚡ 连胜模式",
            best: "🏆 最佳和牌",
            discard: "🀄 打什么？"
        },

        descriptions: {
            veryEasy: "📌 <b>入门模式 (混一色):</b><br>• 包含 1~2 组字牌（东/南/西/北/白/发/中）刻子的混一色听牌牌型。<br>• 数牌仅有 7~10 张，非常适合轻松练习听牌分析。",
            easy: "📌 <b>🌱 简单模式:</b><br>• 仅有 1~2 个和牌的简单题目，并提示和牌数量。<br>• 提交后提供听牌类型及详细拆解说明。",
            normal: "📌 <b>🌿 普通模式:</b><br>• 以 2 个和牌为主的常见听牌型。<br>• 提交后提供听牌类型及详细拆解说明。",
            hard: "📌 <b>🔥 困难模式:</b><br>• 复杂的多面听牌型。<br>• 提交后分析所有可能组合与听牌类型。",
            streak: "📌 <b>⚡ 困难连胜模式:</b><br>• ⏱️ <b>60秒限时:</b> 每题须在60秒内完成。<br>• 🏆 <b>全球名人堂:</b> 达成10连胜以上时将保存至全球排行榜。<br>• ✏️ <b>玩家名称:</b> 未输入时默认显示为 Anonymous。",
            best: "📌 <b>🏆 最高和牌模式：</b><br>• 在所有和牌中，找出能组成最高番数（最高役型）的和牌模式。<br>• 默认假设“立直”与“门前清自摸和”，但忽略宝牌（Dora）和红宝牌。<br>• 若存在多张同番数的牌，选择其中任意一张均算正确。<br>• 提交后，将提供1~9各和牌的番数详细分析报告。",
            discard: "📌 <b>🀄 打什么？模式：</b><br>• 从14张手牌（13张 + 摸到的牌）中打出牌后达成听牌，并选择听牌张数最多的<b>最佳打牌</b>模式。<br>• 即使牺牲番数（打点），也请优先选择能使听牌张数最大化的打牌。<br>• 若有机会达成“役满听牌”，选择该打牌同样算作正确。<br>• 提交后提供按打牌分类的听牌列表及张数分析报告。"
        },

        buttons: {
            startGame: "🎮 开始游戏",
            submit: "提交并查看答案",
            nextStreak: "进入下一题",
            nextSame: "同难度再来一题",
            saveRecord: "提交成绩",
            shareProblem: "分享题目",
            copy: "复制",
            apply: "应用",
            clear: "全部清除",
            close: "关闭"
        },

        share: {
            copiedNotice: "🔗 题目分享链接已复制到剪贴板！",
            invalidUrlParam: "⚠️ URL 参数格式不正确。\n请检查输入值（牌张数量及数字范围）。",
            loadedFromUrl: "🔗 已成功从分享链接加载题目。"
        },

        quizInstruction: {
            default: "请<span style=\"color: red;\">选择所有</span>可以和牌（听牌）的数字:",
            best: "请<span style=\"color: red;\">仅选择一个</span>最佳和牌数字:",
            discard: "请<span style=\"color: red;\">仅选择一张</span>要打出的牌:",
            shortcut: "(快捷键: 1~9, Enter)"
        },

        stats: {
            title: "📊 我的战绩",
            mode: "游戏模式",
            plays: "游戏次数",
            correct: "答对",
            wrong: "答错",
            unsubmitted: "未提交",
            rate1: "正确率1",
            rate2: "正确率2",
            maxScore: "最高纪录",
            btnChangeId: "更改PID",
            btnResetStats: "清除战绩",
            btnClose: "关闭",
            confirmReset: "确定要删除所有游戏记录吗？"
        },

        zoomctrl: {
            zoomOut: "🔍- 缩小",
            zoomIn: "🔍+ 放大",
            lineToggle: "换行 (1行/2行)",
            reset: "重置 🔄"
        },

        analyzer: {
            title: "🕵️‍♂️ 隐藏手牌分析器（自由输入）",
            inputLabel: "⌨️ 直接输入数字 (例: 1112345678999):",
            inputPlaceholder: "输入13位数字",
            applyBtn: "应用",
            copyBtn: "复制题目",
            emptyHint: "请点击1~9按钮或输入数字。",
            clearBtn: "全部清除",
            analyzeBtn: "🔍 计算听牌与解析"
        },

        yaku: {
            chinitsu: "清一色",
            reach: "立直",
            tsumo: "门前清自摸和",
            tanyao: "断幺九",
            pinfu: "平和",
            iipeikou: "一杯口",
            ittsu: "一气通贯",
            junchan: "纯全带幺九",
            chiitoi: "七对子",
            ryanpeikou: "两杯口",
            toitoi: "对对和",
            sanankou: "三暗刻",
            suuankou: "四暗刻",
            suuankouTanki: "四暗刻单骑",
            chuuren: "九莲宝灯",
            junseiChuuren: "纯正九莲宝灯",
            ryuuisou: "绿一色",
            chinroto: "清老头"
        },

        bestReport: {
            headerTitle: "1~9 和牌番数详细分析报告",
            condition: "(条件: 默认应用 立直1番 + 门前清自摸和1番)",
            yakumanTenpaiAlert: "已达成役满听牌！({yaku})", // 👈 추가
            optimalChoice: "[最佳选择]",
            yakumanFormat: "{count}倍役满",
            yakuman: "役满",
            han: "{count}番",
            invalid4Tiles: "0番 [错误: 手牌已使用4张]",
            invalidNoYaku: "0番 [错误: 无役]",
            labelBest: "🏆 [最佳答案]",
            labelValid: "⭕ [可和牌]",
            labelInvalid: "❌ [不可和牌]",
            errInvalidHand: "手牌或和牌输入不正确。",
            errMax4Tiles: "同一张牌不能超过4张。",
            errNotChinitsu: "非清一色和牌（和牌不匹配或未听牌）。",
            correctMsg: "您选择的 [{tile}] 号牌是能够组成最高番数(<b>{score}</b>)的最佳和牌！",
            incorrectMsg: "您选择的 [{tile}] 号牌不是最高番数。<br>👉 番数最高的和牌为: <b>[ {bestTiles} ]</b> ({score})"
        },

        hallOfFame: {
            title: "🏆 连胜模式 全球名人堂 (Top 10)",
            subtitle: "🌐 基于 Google Sheets 绑定的实时全球排行榜。",
            loading: "正在加载纪录...",
            congrats: "🏆 恭喜！达成 10 连胜以上纪录！",
            inputNotice: "名人堂登记名称 (未输入时为 Anonymous):",
            inputPlaceholder: "Anonymous (最多20字)"
        },
        modal: {
            title: "⚡ 困难 连胜模式",
            timeRule: "⏱️ <b>60秒限时:</b> 每题须在60秒内完成。",
            hofRule: "🏆 <b>全球名人堂:</b> 达到 <b>10连胜以上</b> 即可登榜。",
            nameRule: "✏️ <b>玩家名称:</b> 未输入时默认显示为 <b>Anonymous</b>。",
            startBtn: "开始挑战"
        },

        waits: {
            ryanmen: "两面",
            tanki: "单骑",
            shanpon: "双碰",
            kanchan: "嵌张",
            penchan: "边张",
            ryanpeikouNotice: "💡 本题包含两杯口牌型。",
            chiitoiNotice: "💡 本题为清一色与七对子复合的单骑听牌。"
        },

        result: {
            correct: "🎉 回答正确！",
            incorrect: "❌ 回答错误。",
            timeout: "⏰ 时间到！",
            actualWaits: "实际和牌",
            theoreticalWaits: "理论听牌",
            maxedNotice: "(※ {tiles} 已经被手牌使用4张，无法完成和牌)",
            alertSelectTile: "请至少选择一张和牌。"
        }
    },
    zh_TW: {
        title: "清一色 聽牌 猜謎",
        loading: "📦 正在載入麻將牌資源...",
        loadingSuccess: "✅ 麻將牌載入完成！請選擇遊戲模式。",
        loadingError: "❌ 麻將牌載入失敗！請確認檔案是否在同一資料夾。",
        hintEasy: "💡 提示: 共有 {count} 個胡牌（聽牌）。",

        modes: {
            veryEasy: "🌱 入門 (混一色)",
            easy: "🌱 簡單",
            normal: "🌾 普通",
            hard: "🔥 困難",
            streak: "⚡ 連勝模式",
            best: "🏆 最佳胡牌",
            discard: "🀄 打什麼？"
        },

        descriptions: {
            veryEasy: "📌 <b>入門模式 (混一色):</b><br>• 包含 1~2 組字牌（東/南/西/北/白/發/中）刻子的混一色聽牌牌型。<br>• 數牌僅有 7~10 張，非常適合輕鬆練習聽牌分析。",
            easy: "📌 <b>🌱 簡單模式:</b><br>• 僅有 1~2 個胡牌的簡單題目，並提示胡牌數量。<br>• 提交後提供聽牌類型及詳細拆分說明。",
            normal: "📌 <b>🌿 普通模式:</b><br>• 以 2 個胡牌為主的常見聽牌型。<br>• 提交後提供聽牌類型及詳細拆分說明。",
            hard: "📌 <b>🔥 困難模式:</b><br>• 複雜的多面聽牌型。<br>• 提交後解析所有可能組合與聽牌類型。",
            streak: "📌 <b>⚡ 困難連勝模式:</b><br>• ⏱️ <b>60秒限時:</b> 每題須在60秒內完成。<br>• 🏆 <b>全球名人堂:</b> 達成10連勝以上時將儲存至全球排行榜。<br>• ✏️ <b>玩家名稱:</b> 未輸入時預設顯示為 Anonymous。",
            best: "📌 <b>🏆 最高胡牌模式：</b><br>• 在所有胡牌中，找出能組成最高番數（役種）的牌。<br>• 預設假設「立直」與「門前清自摸和」，但忽略寶牌（Dora）和紅寶牌。<br>• 若存在多張同番數的牌，選擇其中任意一張均算正確。<br>• 提交後，將提供1~9各胡牌的番數詳細分析報告。",
            discard: "📌 <b>🀄 打什麼？模式：</b><br>• 從14張手牌（13張 + 摸到的牌）中打出牌後達成聽牌，並選擇聽牌張數最多的<b>最佳打牌</b>模式。<br>• 即使犧牲番數（打點），也請優先選擇能使聽牌張數最大化的打牌。<br>• 若有機會達成「役滿聽牌」，選擇該打牌同樣算作正確。<br>• 提交後提供按打牌分類的聽牌列表及張數分析報告。"
        },

        buttons: {
            startGame: "🎮 開始遊戲",
            submit: "提交並確認答案",
            nextStreak: "進入下一題",
            nextSame: "同難度再挑戰一題",
            saveRecord: "送出紀錄",
            shareProblem: "分享題目",
            copy: "複製",
            apply: "套用",
            clear: "全部清除",
            close: "關閉"
        },

        share: {
            copiedNotice: "🔗 題目分享連結已複製到剪貼簿！",
            invalidUrlParam: "⚠️ URL 參數格式不正確。\n請檢查輸入值（牌張數量及數字範圍）。",
            loadedFromUrl: "🔗 已成功從分享連結載入題目。"
        },

        quizInstruction: {
            default: "請<span style=\"color: red;\">選擇所有</span>可以胡牌（聽牌）的數字:",
            best: "請<span style=\"color: red;\">僅選擇一個</span>最佳胡牌數字:",
            discard: "請<span style=\"color: red;\">僅選擇一張</span>要打出的牌:",
            shortcut: "(快捷鍵: 1~9, Enter)"
        },

        stats: {
            title: "📊 我的戰績",
            mode: "遊戲模式",
            plays: "遊戲次數",
            correct: "答對",
            wrong: "答錯",
            unsubmitted: "未提交",
            rate1: "正確率1",
            rate2: "正確率2",
            maxScore: "最高紀錄",
            btnChangeId: "變更PID",
            btnResetStats: "清除戰績",
            btnClose: "關閉",
            confirmReset: "確定要刪除所有遊戲紀錄嗎？"
        },

        zoomctrl: {
            zoomOut: "🔍- 縮小",
            zoomIn: "🔍+ 放大",
            lineToggle: "換行 (1行/2行)",
            reset: "重置 🔄"
        },

        analyzer: {
            title: "🕵️‍♂️ 隱藏手牌分析器（自由輸入）",
            inputLabel: "⌨️ 直接輸入數字 (例: 1112345678999):",
            inputPlaceholder: "輸入13位數字",
            applyBtn: "套用",
            copyBtn: "複製題目",
            emptyHint: "請點擊1~9按鈕或輸入數字。",
            clearBtn: "全部清除",
            analyzeBtn: "🔍 計算聽牌與解析"
        },

        yaku: {
            chinitsu: "清一色",
            reach: "立直",
            tsumo: "門前清自摸和",
            tanyao: "斷幺九",
            pinfu: "平和",
            iipeikou: "一杯口",
            ittsu: "一氣通貫",
            junchan: "純全帶幺九",
            chiitoi: "七對子",
            ryanpeikou: "兩盃口",
            toitoi: "對對和",
            sanankou: "三暗刻",
            suuankou: "四暗刻",
            suuankouTanki: "四暗刻單騎",
            chuuren: "九蓮寶燈",
            junseiChuuren: "純正九蓮寶燈",
            ryuuisou: "綠一色",
            chinroto: "清老頭"
        },

        bestReport: {
            headerTitle: "1~9 胡牌番數詳細分析報告",
            condition: "(條件: 預設套用 立直1番 + 門前清自摸和1番)",
            yakumanTenpaiAlert: "已達成役滿聽牌！({yaku})", // 👈 추가
            optimalChoice: "[最佳選擇]",
            yakumanFormat: "{count}倍役滿",
            yakuman: "役滿",
            han: "{count}番",
            invalid4Tiles: "0番 [錯誤: 手牌已使用4張]",
            invalidNoYaku: "0番 [錯誤: 無役]",
            labelBest: "🏆 [最佳答案]",
            labelValid: "⭕ [可胡牌]",
            labelInvalid: "❌ [不可胡牌]",
            errInvalidHand: "手牌或胡牌輸入不正確。",
            errMax4Tiles: "同一張牌不能超過4張。",
            errNotChinitsu: "非清一色胡牌（胡牌不匹配或未聽牌）。",
            correctMsg: "您選擇的 [{tile}] 號牌是能夠組成最高番數(<b>{score}</b>)的最佳胡牌！",
            incorrectMsg: "您選擇的 [{tile}] 號牌不是最高番數。<br>👉 番數最高的胡牌為: <b>[ {bestTiles} ]</b> ({score})"
        },

        hallOfFame: {
            title: "🏆 連勝模式 全球名人堂 (Top 10)",
            subtitle: "🌐 基於 Google Sheets 連結的即時全球排行榜。",
            loading: "正在載入紀錄...",
            congrats: "🏆 恭喜！達成 10 連勝以上紀錄！",
            inputNotice: "名人堂登記名稱 (未輸入時為 Anonymous):",
            inputPlaceholder: "Anonymous (最多20字)"
        },
        modal: {
            title: "⚡ 困難 連勝模式",
            timeRule: "⏱️ <b>60秒限時:</b> 每題須在60秒內完成。",
            hofRule: "🏆 <b>全球名人堂:</b> 達到 <b>10連勝以上</b> 即可登榜。",
            nameRule: "✏️ <b>玩家名稱:</b> 未輸入時預設顯示為 <b>Anonymous</b>。",
            startBtn: "開始挑戰"
        },

        waits: {
            ryanmen: "兩面",
            tanki: "單騎",
            shanpon: "雙碰",
            kanchan: "嵌張",
            penchan: "邊張",
            ryanpeikouNotice: "💡 本題包含兩盃口牌型。",
            chiitoiNotice: "💡 本題為清一色與七對子複合的單騎聽牌。"
        },

        result: {
            correct: "🎉 回答正確！",
            incorrect: "❌ 回答錯誤。",
            timeout: "⏰ 時間到！",
            actualWaits: "實際胡牌",
            theoreticalWaits: "理論聽牌",
            maxedNotice: "(※ {tiles} 已經在手牌中使用4張，無法完成胡牌)",
            alertSelectTile: "請至少選擇一張胡牌。"
        }
    },
    en: {
        title: "Chinitsu Tenpai Waiting Tile Quiz",
        loading: "📦 Loading Mahjong tile resources...",
        loadingSuccess: "✅ Tile resources loaded! Select a game mode.",
        loadingError: "❌ Failed to load Mahjong tiles! Check if files are in the same folder.",
        hintEasy: "💡 Hint: There are {count} winning tile(s).",

        modes: {
            veryEasy: "🌱 Very Easy (Honitsu)",
            easy: "🌱 Easy",
            normal: "🌿 Normal",
            hard: "🔥 Hard",
            streak: "⚡ Streak Mode",
            best: "🏆 Best Winning Tile",
            discard: "🀄 What to Discard?"
        },

        descriptions: {
            veryEasy: "📌 <b>🌱 Very Easy Mode (Honitsu):</b><br>• A Honitsu Tenpai hand containing 1-2 sets of honor triplets (Wind/Dragon tiles).<br>• Designed with fewer suit tiles (7-10 tiles) for beginner-friendly wait tile analysis.",
            easy: "📌 <b>🌱 Easy Mode:</b><br>• Simple hands with 1-2 winning tiles. Displays the tile count hint.<br>• Provides detailed hand decompositions and wait types after submission.",
            normal: "📌 <b>🌿 Normal Mode:</b><br>• Standard hands, mostly with 2 winning tiles.<br>• Provides detailed hand decompositions and wait types after submission.",
            hard: "📌 <b>🔥 Hard Mode:</b><br>• Complex multi-sided waits.<br>• Provides full structural decompositions and wait type analysis.",
            streak: "📌 <b>⚡ Hard Streak Mode:</b><br>• ⏱️ <b>60s Timer:</b> Solve each puzzle within 60 seconds.<br>• 🏆 <b>Global Hall of Fame:</b> Reaching a 10+ streak saves your record on the global leaderboard.<br>• ✏️ <b>Name Setting:</b> Leaving it blank registers as Anonymous.",
            best: "📌 <b>🏆 Best Winning Tile Mode:</b><br>• A mode where you guess the winning tile that forms the highest Han value.<br>• Assumes 'Riichi' and 'Menzen Tsumo' (Fully Concealed Hand), but ignores Dora and Red Dora.<br>• If there are multiple tiles with the same highest score, any of them will be counted as correct.<br>• After submission, a detailed analysis report of Han counts for winning tiles 1–9 will be provided.",
            discard: "📌 <b>🀄 What to Discard? Mode:</b><br>• Select the <b>best discard tile</b> that achieves Tenpai and maximizes the total number of waiting tile copies from a 14-tile hand (13 hand tiles + 1 drawn tile).<br>• Choose the tile that gives the widest acceptance even if it lowers the total hand score (Han).<br>• If a 'Yakuman Tenpai' is possible, selecting that discard is also counted as correct.<br>• A waiting tile list and quantity analysis report for each discard will be provided after submission."
        },

        buttons: {
            startGame: "🎮 Start Game",
            submit: "Submit Answer",
            nextStreak: "Next Challenge",
            nextSame: "Try Another Question",
            saveRecord: "Submit Score",
            shareProblem: "Share Problem",
            copy: "Copy",
            apply: "Apply",
            clear: "Clear All",
            close: "Close"
        },

        share: {
            copiedNotice: "🔗 Problem share link copied to clipboard!",
            invalidUrlParam: "⚠️ Invalid problem URL parameter format.\nPlease verify tile count and digit range.",
            loadedFromUrl: "🔗 Problem successfully loaded from shared link."
        },

        quizInstruction: {
            default: "Select <span style=\"color: red;\">ALL</span> tile numbers that complete the hand:",
            best: "Select <span style=\"color: red;\">ONLY ONE</span> optimal winning tile:",
            discard: "Select <span style=\"color: red;\">ONLY ONE</span> tile to discard:",
            shortcut: "(Shortcuts: 1-9, Enter)"
        },

        stats: {
            title: "📊 My Game Records",
            mode: "Game Mode",
            plays: "Plays",
            correct: "Correct",
            wrong: "Wrong",
            unsubmitted: "Unsubmitted",
            rate1: "Accuracy 1",
            rate2: "Accuracy 2",
            maxScore: "Best Record",
            btnChangeId: "Change PID",
            btnResetStats: "Reset Data",
            btnClose: "Close",
            confirmReset: "Are you sure you want to delete all game records?"
        },

        zoomctrl: {
            zoomOut: "🔍- Zoom Out",
            zoomIn: "🔍+ Zoom In",
            lineToggle: "Toggle Wrap (1/2 Lines)",
            reset: "Reset 🔄"
        },

        analyzer: {
            title: "🕵️‍♂️ Hidden Analyzer (Custom Hand Input)",
            inputLabel: "⌨️ Direct Number Input (e.g. 1112345678999):",
            inputPlaceholder: "Enter 13 digits",
            applyBtn: "Apply",
            copyBtn: "Copy Quiz",
            emptyHint: "Select 1-9 buttons or enter numbers.",
            clearBtn: "Clear All",
            analyzeBtn: "🔍 Analyze Wait Tiles & Breakdown"
        },

        yaku: {
            chinitsu: "Chinitsu",
            reach: "Riichi",
            tsumo: "Menzen Tsumo",
            tanyao: "Tanyao",
            pinfu: "Pinfu",
            iipeikou: "Iipeikou",
            ittsu: "Ittsu",
            junchan: "Junchan",
            chiitoi: "Chiitoitsu",
            ryanpeikou: "Ryanpeikou",
            toitoi: "Toitoi",
            sanankou: "Sanankou",
            suuankou: "Suuankou",
            suuankouTanki: "Suuankou Tanki",
            chuuren: "Chuuren Pouton",
            junseiChuuren: "Junsei Chuuren Pouton",
            ryuuisou: "Ryuuisou",
            chinroto: "Chinroto"
        },

        bestReport: {
            headerTitle: "1–9 Winning Tile Han Analysis Report",
            condition: "(Condition: Default applies Riichi 1 Han + Menzen Tsumo 1 Han)",
            yakumanTenpaiAlert: "Yakuman Tenpai Hand! ({yaku})", // 👈 추가
            optimalChoice: "[Optimal Choice]",
            yakumanFormat: "{count}x Yakuman",
            yakuman: "Yakuman",
            han: "{count} Han",
            invalid4Tiles: "0 Han [Incorrect: 4 tiles already in hand]",
            invalidNoYaku: "0 Han [Incorrect: No Yaku]",
            labelBest: "🏆 [Best Answer]",
            labelValid: "⭕ [Valid Win]",
            labelInvalid: "❌ [Invalid]",
            errInvalidHand: "Invalid hand or winning tile input.",
            errMax4Tiles: "Cannot exceed 4 copies of the same tile.",
            errNotChinitsu: "Not a valid Chinitsu winning hand.",
            correctMsg: "Tile [{tile}] is the optimal tile that yields the highest hand value (<b>{score}</b>)!",
            incorrectMsg: "Tile [{tile}] does not yield the highest score.<br>👉 Highest scoring tile(s): <b>[ {bestTiles} ]</b> ({score})"
        },

        hallOfFame: {
            title: "🏆 Global Hall of Fame (Top 10)",
            subtitle: "🌐 Live global leaderboard synced via Google Sheets.",
            loading: "Loading records...",
            congrats: "🏆 Congratulations! You achieved a 10+ win streak!",
            inputNotice: "Leaderboard display name (Default: Anonymous):",
            inputPlaceholder: "Anonymous (Max 20 ch)"
        },
        modal: {
            title: "⚡ Hard Streak Mode",
            timeRule: "⏱️ <b>60s Timer:</b> Solve each puzzle within 60 seconds.",
            hofRule: "🏆 <b>Hall of Fame:</b> Reaching a <b>10+ streak</b> registers you on the leaderboard.",
            nameRule: "✏️ <b>Name Option:</b> Leaving it blank registers as <b>Anonymous</b>.",
            startBtn: "Start Challenge"
        },

        waits: {
            ryanmen: "Ryanmen (Two-sided)",
            tanki: "Tanki (Single)",
            shanpon: "Shanpon (Dual-pair)",
            kanchan: "Kanchan (Closed)",
            penchan: "Penchan (Edge)",
            ryanpeikouNotice: "💡 This hand contains a Ryanpeikou (Two Double Pungs) pattern.",
            chiitoiNotice: "💡 This hand is a combination of Chinitsu and Chiitoitsu (Seven Pairs) Tanki wait."
        },

        result: {
            correct: "🎉 Correct!",
            incorrect: "❌ Incorrect.",
            timeout: "⏰ Time's up!",
            actualWaits: "Winning Tiles",
            theoreticalWaits: "Theoretical Waits",
            maxedNotice: "(※ Tile {tiles} is maxed out with 4 copies in hand, so it cannot complete the hand)",
            alertSelectTile: "Please select at least one winning tile."
        }
    }
};
