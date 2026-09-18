let foodData = null;
let currentMode = 'full';

// 페이지 로드시 menu_data.txt 파일 로딩
document.addEventListener('DOMContentLoaded', () => {
    loadMenuData();
});

async function loadMenuData() {
    try {
        const response = await fetch('menu_data.json');
        if (!response.ok) {
            throw new Error('메뉴 데이터를 불러오는 데 실패했습니다.');
        }
        foodData = await response.json();
    } catch (error) {
        console.error('Error loading menu data:', error);
        const resultContainer = document.getElementById('resultContainer');
        resultContainer.innerHTML = '<div class="placeholder-text" style="color: #E53E3E;">메뉴 데이터를 불러오지 못했습니다. (서버 환경 필요)</div>';
    }
}

function setMode(mode, btn) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickMenu() {
    const resultContainer = document.getElementById('resultContainer');

    if (!foodData) {
        resultContainer.innerHTML = '<div class="placeholder-text">메뉴 데이터를 로딩 중입니다...</div>';
        return;
    }

    resultContainer.innerHTML = '';
    let items = [];

    if (currentMode === 'full') {
        items.push({ cat: '메인 주식', name: getRandom(foodData.main), class: 'cat-main' });
        items.push({ cat: '어울리는 반찬', name: getRandom(foodData.side), class: 'cat-side' });
        items.push({ cat: '달콤한 디저트', name: getRandom(foodData.dessert), class: 'cat-dessert' });
        items.push({ cat: '시원한 음료', name: getRandom(foodData.drink), class: 'cat-drink' });
    } else if (currentMode === 'simple') {
        items.push({ cat: '오늘의 메인', name: getRandom(foodData.main), class: 'cat-main' });
        if (Math.random() > 0.4) {
            items.push({ cat: '곁들일 음료', name: getRandom(foodData.drink), class: 'cat-drink' });
        }
    } else if (currentMode === 'snack') {
        items.push({ cat: '메인 간식', name: getRandom(foodData.snack), class: 'cat-snack' });
        const secondChoice = Math.random() > 0.5 ? 
            { cat: '달콤 후식', name: getRandom(foodData.dessert), class: 'cat-dessert' } : 
            { cat: '시원 음료', name: getRandom(foodData.drink), class: 'cat-drink' };
        items.push(secondChoice);
    }

    const card = document.createElement('div');
    card.className = 'combination-card';

    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'menu-item';
        row.innerHTML = `
            <span class="menu-name">${item.name}</span>
            <span class="menu-category ${item.class}">${item.cat}</span>
        `;
        card.appendChild(row);
    });

    resultContainer.appendChild(card);
}
