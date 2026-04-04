// === API Configuration ===
const API_BASE = window.location.origin;

// === State ===
const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    scenarios: [],
    currentScenario: null,
    currentLocation: null
};

// === Auth Functions ===
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Ошибка запроса');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// === Auth Screen ===
function initAuth() {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
        });
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = '';

        try {
            const data = await apiCall('/api/auth/login', 'POST', {
                username: document.getElementById('login-username').value,
                password: document.getElementById('login-password').value
            });

            state.token = data.access_token;
            state.user = data.user;
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            initMainApp();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('reg-error');
        errorEl.textContent = '';

        try {
            const data = await apiCall('/api/auth/register', 'POST', {
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value
            });

            state.token = data.access_token;
            state.user = data.user;
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            initMainApp();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}

// === Main App Init ===
function initMainApp() {
    showScreen('main-screen');
    updateHeader();
    loadScenarios();
    bindMainEvents();
}

function updateHeader() {
    if (state.user) {
        document.getElementById('league-name').textContent = state.user.league || 'Новичок';
        document.getElementById('rep-value').textContent = state.user.reputation || 500;

        const leagueIcons = {
            'Новичок': '🌱', 'Средний': '📗', 'Продвинутый': '📘',
            'Эксперт': '🎓', 'Мастер': '🏅', 'Легенда': '👑'
        };
        document.querySelector('.league-icon').textContent = leagueIcons[state.user.league] || '🌱';
    }
}

function bindMainEvents() {
    document.getElementById('btn-logout').addEventListener('click', () => {
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showScreen('auth-screen');
    });

    document.getElementById('btn-stats').addEventListener('click', async () => {
        showView('stats-view');
        await loadStats();
    });

    document.getElementById('btn-back-from-stats').addEventListener('click', () => {
        showView('map-view');
    });

    document.getElementById('btn-back-to-map').addEventListener('click', () => {
        showView('map-view');
    });

    document.getElementById('btn-back-to-scenarios').addEventListener('click', () => {
        if (state.currentLocation) {
            showView('scenarios-view');
        } else {
            showView('map-view');
        }
    });

    document.getElementById('btn-next-scenario').addEventListener('click', () => {
        document.getElementById('result-overlay').style.display = 'none';
        showView('scenarios-view');
        loadScenariosForLocation(state.currentLocation);
    });

    // Location cards
    document.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('click', () => {
            state.currentLocation = card.dataset.location;
            loadScenariosForLocation(state.currentLocation);
        });
    });
}

// === Scenarios ===
async function loadScenarios() {
    try {
        state.scenarios = await apiCall('/api/game/scenarios');
        updateLocationsProgress();
    } catch (error) {
        console.error('Failed to load scenarios:', error);
    }
}

function updateLocationsProgress() {
    const locations = ['Офис', 'Дом', 'Общественный Wi-Fi', 'Улица'];

    locations.forEach(loc => {
        const locScenarios = state.scenarios.filter(s => s.location === loc);
        const card = document.querySelector(`.location-card[data-location="${loc}"]`);
        if (!card) return;

        const countEl = card.querySelector('.location-count');
        const fillEl = card.querySelector('.progress-fill');

        // Получаем прогресс из localStorage или API
        const completed = locScenarios.filter(s => {
            const progress = localStorage.getItem(`progress_${state.user.id}_${s.id}`);
            return progress && JSON.parse(progress).completed;
        }).length;

        countEl.textContent = `${completed}/${locScenarios.length} пройдено`;
        fillEl.style.width = locScenarios.length > 0 ? `${(completed / locScenarios.length) * 100}%` : '0%';
    });
}

function loadScenariosForLocation(location) {
    const filtered = state.scenarios.filter(s => s.location === location);
    const listEl = document.getElementById('scenarios-list');
    listEl.innerHTML = '';

    document.getElementById('location-title').textContent = `${location} — Сценарии`;

    const typeIcons = {
        'Фишинг': '📧', 'Подбор пароля': '🔑', 'MITM-атака': '📡',
        'Социальная инженерия': '📞', 'Дипфейк': '🎭', 'Скимминг': '💳', 'QR-фишинг': '📱'
    };

    filtered.forEach(scenario => {
        const progress = localStorage.getItem(`progress_${state.user.id}_${scenario.id}`);
        const isCompleted = progress && JSON.parse(progress).completed;

        const item = document.createElement('div');
        item.className = `scenario-item ${isCompleted ? 'completed' : ''}`;
        item.innerHTML = `
            <div class="scenario-icon">${typeIcons[scenario.attack_type] || '🎯'}</div>
            <div class="scenario-info">
                <h4>${scenario.title}</h4>
                <p>${scenario.attack_type} • Уровень ${scenario.level}</p>
            </div>
            <span class="scenario-badge badge-${scenario.level === 1 ? 'easy' : scenario.level === 2 ? 'medium' : 'hard'}">
                ${scenario.level === 1 ? 'Легко' : scenario.level === 2 ? 'Средне' : 'Сложно'}
            </span>
        `;
        item.addEventListener('click', () => startScenario(scenario));
        listEl.appendChild(item);
    });

    showView('scenarios-view');
}

// === Stats ===
async function loadStats() {
    try {
        const stats = await apiCall('/api/stats/');

        document.getElementById('stat-completed').textContent = stats.completed_scenarios;
        document.getElementById('stat-rate').textContent = stats.success_rate + '%';
        document.getElementById('stat-rep').textContent = stats.current_reputation;
        document.getElementById('stat-league').textContent = stats.league;
        document.getElementById('league-bar-fill').style.width = (stats.league_progress * 100) + '%';

        // Обновляем состояние пользователя
        state.user.reputation = stats.current_reputation;
        state.user.league = stats.league;
        localStorage.setItem('user', JSON.stringify(state.user));
        updateHeader();

        // История
        const historyEl = document.getElementById('scenarios-history-list');
        historyEl.innerHTML = '';

        if (stats.scenario_results.length === 0) {
            historyEl.innerHTML = '<p style="text-align:center;color:#999;padding:1rem;">Пока нет пройденных сценариев</p>';
        } else {
            stats.scenario_results.forEach(r => {
                const scenario = state.scenarios.find(s => s.id === r.scenario_id);
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <span>${scenario ? scenario.title : `Сценарий #${r.scenario_id}`}</span>
                    <span class="history-status ${r.is_completed ? 'success' : 'failed'}">
                        ${r.is_completed ? '✅ Пройден' : '❌ Не пройден'} (${r.attempts} попыток)
                    </span>
                `;
                historyEl.appendChild(item);
            });
        }

        // Сертификат
        const certEl = document.getElementById('certificate-status');
        if (stats.success_rate >= 80 && stats.completed_scenarios >= state.scenarios.length) {
            certEl.className = 'certificate-unlocked';
            certEl.innerHTML = `
                <div style="font-size:2rem;margin-bottom:0.5rem;">🏆</div>
                <h3>Сертификат получен!</h3>
                <p>Вы успешно прошли все сценарии с результатом ${stats.success_rate}%</p>
                <div style="margin-top:1rem;font-size:0.8rem;opacity:0.8;">
                    QR-код: cybercert://verify/${state.user.id}-${Date.now()}
                </div>
            `;
        } else {
            certEl.className = 'certificate-locked';
            const remaining = state.scenarios.length - stats.completed_scenarios;
            certEl.innerHTML = `
                <div class="cert-lock-icon">🔒</div>
                <p>Осталось пройти сценариев: ${remaining > 0 ? remaining : 0}</p>
                <p>Текущая успешность: ${stats.success_rate}% (нужно ≥ 80%)</p>
            `;
        }

    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    if (state.token && state.user) {
        initMainApp();
    }
});