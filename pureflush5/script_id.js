/* =============================================================
   📌 유저 고유 ID 관리 모듈 (script_id.js)
   ============================================================= */

// 단어 리스트 (원하는 영단어를 추가/수정하셔도 됩니다)

/* =============================================================
   📌 긍정적/중립적 형용사 리스트 (ID_ADJS) - 총 300여 개
   ============================================================= */
const ID_ADJS = [
    // --- ID_WORDS에서 이동한 형용사 ---
    'golden', 'cosmic', 'atomic', 'velvet', 'mossy', 'autumnal', 'kinetic',
    'lunar', 'nebulate', 'celestial', 'charming', 'classic', 'cozy', 'crimson',
    'dulcet', 'elysian', 'enchant', 'fable', 'finesse', 'flicker', 'glimmer',
    'hallow', 'hearty', 'humble', 'kindred', 'legendary', 'mellow', 'mystic',
    'opulent', 'peaceful', 'precious', 'quaint', 'radiant', 'serene', 'shimmer',
    'sincere', 'sublime', 'velvety', 'vibrant', 'vintage', 'action', 'antique',
    'astral', 'autonomy', 'beloved', 'benign', 'bright', 'clever', 'earnest',
    'empower', 'energetic', 'epic', 'equal', 'equestrian', 'eternal', 'ethical',
    'fearless', 'fidelity', 'forward', 'gallant', 'genius', 'honest', 'humble',
    'ideal', 'imperial', 'integrity', 'intrepid', 'invincible', 'jubilee', 'noble',
    'olympian', 'placid', 'potency', 'pragmatic', 'prestige', 'prudence', 'puritan',
    'resilient', 'righteous', 'royal', 'splendid', 'stalwart', 'steadfast', 'superior',
    'supreme', 'tactical', 'tenacity', 'ultimate', 'upright', 'valiant', 'veracity',
    'veteran', 'vigilant', 'virtuous', 'worthy', 'zealous',

    // --- 추가 형용사 (긍정적/건전, 4~9자) ---
    'active', 'agile', 'alert', 'alive', 'aptly', 'astute', 'august', 'blessed',
    'blithe', 'blooming', 'bouncy', 'breezy', 'brisk', 'buoyant', 'candid', 'carefree',
    'caring', 'casual', 'cheerful', 'chubby', 'civic', 'civil', 'classic', 'clean',
    'clever', 'comfy', 'dapper', 'daring', 'dazzling', 'decent', 'deftly', 'delicate',
    'devoted', 'dexterous', 'divine', 'eager', 'early', 'earthy', 'easygoing', 'ebon',
    'elastic', 'elated', 'elegant', 'eminent', 'endless', 'exalted', 'exotic', 'expert',
    'express', 'fairly', 'famous', 'fancy', 'festive', 'fiery', 'fine', 'first',
    'fitting', 'flashy', 'flawless', 'fleet', 'flexible', 'fluent', 'fluffy', 'fond',
    'fragrant', 'free', 'fresh', 'friendly', 'frosty', 'fulfilled', 'funny', 'gentle',
    'glorious', 'glossy', 'goodly', 'graceful', 'gracious', 'grand', 'great', 'handy',
    'happy', 'hardy', 'harmless', 'healthy', 'helpful', 'heroic', 'hidden', 'holy',
    'hopeful', 'infinite', 'innocent', 'jolly', 'jovial', 'joyful', 'joyous', 'keen',
    'kindly', 'lively', 'lofty', 'lovely', 'loving', 'lucid', 'lucky', 'lush',
    'magical', 'majestic', 'matching', 'mature', 'mighty', 'mindful', 'modest', 'neat',
    'nimble', 'nimble', 'noble', 'organic', 'patient', 'peaceful', 'perfect', 'playful',
    'polite', 'popular', 'precise', 'pristine', 'prompt', 'proper', 'prosper', 'proud',
    'purest', 'quaint', 'quick', 'quiet', 'rapid', 'rarely', 'refined', 'regal',
    'relaxed', 'reliable', 'rewarding', 'rich', 'robust', 'rosy', 'rustic', 'sacred',
    'safe', 'savvy', 'scenic', 'secular', 'serene', 'sharp', 'shiny', 'silent',
    'silken', 'silky', 'simple', 'skillful', 'sleek', 'slender', 'slick', 'smart',
    'smooth', 'snug', 'sober', 'softly', 'solid', 'speedy', 'spiffy', 'splendid',
    'sporty', 'spotless', 'spry', 'stable', 'stately', 'steady', 'stellar', 'still',
    'strong', 'sturdy', 'stylish', 'subtle', 'sunny', 'superb', 'sweet', 'swift',
    'tactful', 'talented', 'tender', 'thrifty', 'tidy', 'timeless', 'tireless', 'trusty',
    'truthful', 'unbeaten', 'unique', 'unmatched', 'unruffled', 'untamed', 'upbeat', 'urgent',
    'valid', 'valued', 'vast', 'vivid', 'warmhearted', 'wealthy', 'wholesome', 'wild',
    'witty', 'wondrous', 'youthful'
];


/* =============================================================
   📌 명사 단어 리스트 (ID_WORDS) - pure 명사만 유지
   ============================================================= */
const ID_WORDS = [
    // 자연 & 동식물
    'dragon', 'tiger', 'phoenix', 'panda', 'falcon', 'shadow', 'storm', 'breeze',
    'crystal', 'silver', 'amber', 'emerald', 'bamboo', 'cherry', 'maple', 'lotus',
    'orchid', 'willow', 'sunset', 'aurora', 'galaxy', 'nebula', 'comet', 'meteor',
    'planet', 'starlight', 'ocean', 'river', 'thunder', 'blaze', 'frost', 'winter',
    'summer', 'autumn', 'spring', 'pine', 'swan', 'wave', 'leaf', 'moss',
    'fern', 'peak', 'lark', 'cedar', 'flora', 'robin', 'coral', 'grove',
    'forest', 'meadow', 'canyon', 'dolphin', 'glacier', 'redwood', 'blossom', 'mountain',
    'wildflower', 'star', 'nova', 'halo', 'moon', 'orbit', 'solar', 'venus',
    'zenith', 'eclipse', 'pinnacle', 'skyline', 'supernova', 'constell', 'glow', 'calm',
    'echo', 'hope', 'bliss', 'peace', 'oasis', 'pastel', 'solace', 'serenity',
    'ruby', 'jade', 'opal', 'gold', 'topaz', 'agate', 'quartz', 'garnet',
    'diamond', 'sapphire', 'amethyst', 'hero', 'sage', 'valor', 'crest', 'quest',
    'scout', 'knight', 'legend', 'shield', 'spirit', 'pioneer', 'journey', 'venture',
    'compass', 'vanguard', 'guardian', 'protector', 'explorer', 'acorn', 'alder', 'alpine',
    'azalea', 'badger', 'barley', 'basil', 'beacon', 'beaver', 'beetle', 'birch',
    'bison', 'bloom', 'bonsai', 'boulder', 'brambler', 'branch', 'brook', 'cactus',
    'canopy', 'clover', 'cobalt', 'condor', 'conifer', 'coppice', 'coyote', 'crane',
    'cricket', 'cypress', 'dahlia', 'daisy', 'drizzle', 'eagle', 'egret', 'elmwood',
    'falconer', 'fawn', 'feather', 'fennel', 'flower', 'forestry', 'foxglove', 'freesia',
    'gazelle', 'geyser', 'gingko', 'glade', 'harbor', 'harrier', 'hazel', 'heather',
    'heron', 'hollow', 'holly', 'hornet', 'iguana', 'island', 'ivory', 'jasmine',
    'jungle', 'kelp', 'kingfisher', 'lagoon', 'laurel', 'lemur', 'leopard', 'lichen',
    'lily', 'linnet', 'lizard', 'lynx', 'magnolia', 'marlin', 'marten', 'merlin',
    'mimosa', 'mirage', 'monarch', 'monsoon', 'narwhal', 'nectar', 'estuary', 'osprey',
    'otter', 'owlfly', 'panther', 'papaya', 'parrot', 'pebble', 'pelican', 'peony',
    'petrel', 'phlox', 'pigeon', 'pinetree', 'plover', 'poplar', 'poppy', 'puffin',
    'pyramid', 'quail', 'raindrop', 'raptor', 'ravine', 'redwing', 'reef', 'ripple',
    'rooster', 'rosemary', 'saffron', 'salmon', 'savanna', 'seabird', 'seagull', 'seahorse',
    'sequoia', 'sesame', 'sparrow', 'spider', 'spruce', 'squirrel', 'thistle', 'timber',
    'tulip', 'tundra', 'turtle', 'valley', 'vanilla', 'vernal', 'violet', 'vulpine',
    'walnut', 'willows', 'wren', 'yarrow', 'zinnia',

    // 우주, 과학, 감성 & 기타 명사
    'altitude', 'aphelion', 'aster', 'astro', 'atom', 'azimuth', 'chronos', 'corona',
    'cosmos', 'crater', 'daybreak', 'daylight', 'daystar', 'dusk', 'equinox', 'ether',
    'fulcrum', 'horizons', 'ignite', 'inertia', 'isotope', 'jupiter', 'latitude', 'magnet',
    'mercury', 'meteoroid', 'midday', 'midnight', 'momentum', 'nebulas', 'neutron', 'octane',
    'parallax', 'pendulum', 'perigee', 'photon', 'plasma', 'pulsar', 'quantum', 'radiance',
    'solstice', 'spark', 'spectrum', 'sphere', 'sundial', 'sunlight', 'sunrise', 'twilight',
    'uranus', 'vector', 'velocity', 'vortex', 'wavelength', 'affinity', 'arcade', 'artwork',
    'aura', 'ballet', 'cadence', 'canvas', 'cascade', 'cherish', 'chime', 'cinema',
    'clarity', 'delight', 'dreamer', 'embrace', 'eternity', 'euphoria', 'flavor', 'flutter',
    'fondness', 'freedom', 'fresco', 'glimpse', 'glitter', 'haven', 'heritage', 'homage',
    'incense', 'infinit', 'inspire', 'lantern', 'leisure', 'liberty', 'life', 'light',
    'lullaby', 'luster', 'lyric', 'melody', 'memory', 'mural', 'muse', 'musing',
    'nostalgia', 'nuance', 'nurture', 'odyssey', 'origami', 'palace', 'paradise', 'passage',
    'passion', 'picture', 'pleasure', 'poetry', 'prairie', 'promise', 'prosperity', 'quiver',
    'rainbow', 'rhapsody', 'rhythm', 'romance', 'scenery', 'serenade', 'shelter', 'silhouette',
    'soothe', 'sparkle', 'splendor', 'symphony', 'tapestry', 'harmony', 'tranquility', 'treasure',
    'utopia', 'whisper', 'wonder', 'academy', 'achieve', 'alchemy', 'ally', 'anchor',
    'angel', 'anthem', 'anvil', 'apogee', 'archway', 'arena', 'armor', 'arrow',
    'artisan', 'aspect', 'aspiration', 'athlete', 'atlas', 'avatar', 'avenue', 'banner',
    'bastion', 'belief', 'blessing', 'bronze', 'brother', 'bulwark', 'caliber', 'captain',
    'castle', 'catalyst', 'champion', 'chivalry', 'citadel', 'clarion', 'climb', 'companion',
    'courage', 'covenant', 'creator', 'crownt', 'crusade', 'curator', 'defender', 'destiny',
    'discovery', 'dynasty', 'embassy', 'emperor', 'empire', 'endure', 'enterprise', 'entrust',
    'essence', 'exalt', 'excellence', 'faith', 'fortress', 'foundation', 'fountain', 'frontier',
    'gateway', 'glory', 'goodness', 'grace', 'guidance', 'honor', 'horizon', 'humanity',
    'identity', 'illustr', 'immunity', 'infinity', 'insight', 'journey', 'justice', 'keep',
    'keeper', 'kindness', 'kingdom', 'kinship', 'knowledge', 'leader', 'legacy', 'liberty',
    'loyalty', 'majesty', 'master', 'mentor', 'monarch', 'monument', 'oracle', 'origin',
    'paladin', 'panoply', 'paradigm', 'pantheon', 'paragon', 'patriarch', 'patriot', 'patron',
    'portal', 'posture', 'praise', 'prince', 'princess', 'principle', 'prowess', 'purity',
    'rally', 'ranger', 'realm', 'recovery', 'resemble', 'respect', 'revere', 'revival',
    'sanctuary', 'scholar', 'sculptor', 'sentry', 'shepherd', 'sovereign', 'spectacle', 'spiral',
    'squire', 'stamina', 'standard', 'statue', 'steward', 'strength', 'strive', 'structure',
    'summit', 'supporter', 'sympathy', 'talent', 'templar', 'temple', 'throne', 'titan',
    'tower', 'triumph', 'trophy', 'trustee', 'truth', 'tutorial', 'unity', 'unison',
    'vanquish', 'verdict', 'verity', 'victor', 'victory', 'vigile', 'vigor', 'virtue',
    'virtuoso', 'viscount', 'vision', 'vitality', 'warrior', 'watchman', 'wisdom', 'wizard'
];

/**
 * 20자 고유 ID 생성 함수
 * 규칙: ADJS + WORDS + 랜덤 숫자/알파벳 패딩 = 정확히 20자 (소문자/숫자)
 */
function generateUniqueUserId() {
    const chars = '0123456789';
    
    // 형용사 1개 + 명사 1개 무작위 선택
    const adj = ID_ADJS[Math.floor(Math.random() * ID_ADJS.length)];
    const word = ID_WORDS[Math.floor(Math.random() * ID_WORDS.length)];
    
    let combined = adj + word;
    
    // 20자를 초과하는 경우 자르기 (최소 패딩용 2자 공간 확보)
    if (combined.length > 18) {
        combined = combined.substring(0, 18);
    }

    // 정확히 20자가 되도록 부족한 길이는 무작위 숫자로 채움
    const remainingLength = 20 - combined.length;
    let randomPadding = '';
    
    for (let i = 0; i < remainingLength; i++) {
        randomPadding += chars[Math.floor(Math.random() * chars.length)];
    }

    return combined + randomPadding;
}

/**
 * 강제로 새 ID를 생성하고 저장 및 화면 갱신 (게임 기록은 그대로 유지)
 */
function regenerateUserId() {
    const newUserId = generateUniqueUserId();
    localStorage.setItem('mahjong_user_id', newUserId);

    // 화면 업데이트
    displayUserId();
}

/**
 * 게임 기록 전체 삭제 및 모달 테이블 초기화
 */
function resetUserStats() {
    if (confirm(t('stats.confirmReset'))) {
        localStorage.removeItem('mahjong_user_stats');
        openStatsModal();
    }
}

/**
 * 사용자 ID를 가져오거나 없으면 새로 생성 후 저장
 */
function getOrCreateUserId() {
    const STORAGE_KEY = 'mahjong_user_id';
    let userId = localStorage.getItem(STORAGE_KEY);

    if (!userId || userId.length !== 20) {
        userId = generateUniqueUserId();
        localStorage.setItem(STORAGE_KEY, userId);
    }

    return userId;
}

// 6개 게임 모드 정의
const GAME_MODES = [
    { id: 'mode1', name: t('modeEasy') },
    { id: 'mode2', name: t('modeNormal') },
    { id: 'mode3', name: t('modeHard') },
    { id: 'mode4', name: t('modeBest') },
    { id: 'mode5', name: t('modeDiscard') },
    { id: 'mode6', name: t('modeStreak') }
];

/**
 * 저장된 기록 불러오기 (데이터가 없으면 0으로 초기화된 데이터 반환)
 */
function getUserStats() {
    const savedStats = localStorage.getItem('mahjong_user_stats');
    if (savedStats) {
        return JSON.parse(savedStats);
    }

    // 기본 데이터 구조 (현재는 저장된 데이터가 없으므로 0으로 초기화)
    const initialStats = {};
    GAME_MODES.forEach(mode => {
        initialStats[mode.id] = { playCount: 0, correct: 0, wrong: 0, max: 0 };
    });
    return initialStats;
}

/**
 * 기록 모달 열기 및 테이블 갱신
 */
function openStatsModal() {
    const stats = getUserStats();
    const tbody = document.getElementById('stats-table-body');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    GAME_MODES.forEach(mode => {
        const data = stats[mode.id] || { playCount: 0, correct: 0, wrong: 0, max: 0 };
        
        // 미제출 카운트 계산
        const playCount = data.playCount || 0;
        const correct = data.correct || 0;
        const wrong = data.wrong || 0;
        const unsubmitted = Math.max(0, playCount - correct - wrong);

        // 📌 정답률1 (미제출 미고려: correct / (correct + wrong) * 100)
        let rate1Text = '-';
        const totalSubmitted = correct + wrong;
        if (totalSubmitted > 0) {
            const rate1 = ((correct / totalSubmitted) * 100).toFixed(1);
            rate1Text = `${rate1}%`;
        }

        // 📌 정답률2 (미제출 고려: correct / playCount * 100)
        let rate2Text = '-';
        if (playCount > 0) {
            const rate2 = ((correct / playCount) * 100).toFixed(1);
            rate2Text = `${rate2}%`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mode.name}</td>
            <td>${playCount}</td>
            <td class="txt-correct">${correct}</td>
            <td class="txt-wrong">${wrong}</td>
            <td class="txt-unsubmitted">${unsubmitted}</td>
            <td class="txt-rate1">${rate1Text}</td>
            <td class="txt-rate2">${rate2Text}</td>
            <td class="txt-max">${data.max || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('stats-modal').style.display = 'flex';
}

/**
 * 기록 모달 닫기
 */
function closeStatsModal() {
    document.getElementById('stats-modal').style.display = 'none';
}

// 모달 바깥 배경 클릭 시 닫기
window.addEventListener('click', (event) => {
    const modal = document.getElementById('stats-modal');
    if (event.target === modal) {
        closeStatsModal();
    }
});


/**
 * UI 상단에 ID 표시 함수
 */
function displayUserId() {
    const userId = getOrCreateUserId();
    
    // 메인 헤더 영역 PID 갱신
    const userIdElem = document.getElementById('user-id-display');
    if (userIdElem) {
        userIdElem.innerText = userId;
    }
    
    // 모달 내 PID 갱신
    const modalUserIdElem = document.getElementById('modal-user-id-display');
    if (modalUserIdElem) {
        modalUserIdElem.innerText = userId;
    }
}

// DOM이 준비되면 바로 실행하여 화면에 표시
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayUserId);
} else {
    displayUserId();
}


