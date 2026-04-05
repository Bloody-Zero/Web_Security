// === CyberShield Simulator - Frontend JS ===
// === Конфигурация ===
const API_BASE = window.location.origin;

// === Глобальное состояние ===
const state = {
    token: null,
    user: null,
    scenarios: [],
    currentScenario: null,
    currentLocation: null
};

// === Инициализация авторизации при загрузке ===
function initAuthState() {
    const savedToken = localStorage.getItem('cyber_token');
    const savedUser = localStorage.getItem('cyber_user');

    if (savedToken && savedUser) {
        try {
            state.token = savedToken;
            state.user = JSON.parse(savedUser);
            console.log('✅ Токен загружен из localStorage');
        } catch (e) {
            console.error('❌ Ошибка парсинга user:', e);
            logout();
        }
    }
}

// === Универсальная функция API-запросов с отладкой ===
async function apiCall(endpoint, method = 'GET', body = null) {
    // 🔐 Явно получаем токен из двух источников
    const token = state.token || localStorage.getItem('cyber_token');

    const headers = {
        'Content-Type': 'application/json',
    };

    // 🔐 Всегда добавляем Authorization, если токен есть
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`🔐 [API] ${method} ${endpoint} | Token: ${token.substring(0, 25)}...`);
    } else {
        console.warn(`⚠️ [API] ${method} ${endpoint} | ⚠️ НЕТ ТОКЕНА!`);
    }

    // 📋 Логируем заголовки для отладки
    console.log('📦 Headers:', {
        ...headers,
        Authorization: headers.Authorization ? 'Bearer ***' : undefined
    });

    const config = { method, headers };
    if (body) {
        config.body = JSON.stringify(body);
        console.log('📦 Body:', body);
    }

    try {
        console.log(`📤 Запрос: ${method} ${API_BASE}${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        // 📥 Логируем ответ
        console.log(`📥 Ответ: ${response.status} ${response.statusText}`);

        if (response.status === 401) {
            console.error('❌ 401 — токен не принят сервером');
            console.error('   Возможные причины:');
            console.error('   1) Неверный формат: должно быть "Bearer <token>"');
            console.error('   2) Токен истёк (проверьте ACCESS_TOKEN_EXPIRE_MINUTES)');
            console.error('   3) SECRET_KEY на сервере изменился');
        }

        const data = await response.json();

        if (!response.ok) {
            const msg = data.detail || `Ошибка ${response.status}`;
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
        return data;
    } catch (error) {
        console.error(`❌ API Error [${method} ${endpoint}]:`, error.message);
        throw error;
    }
}

// === Управление сессией ===
function login(token, user) {
    console.log('🔐 login() вызвана');

    // 🔐 Явно устанавливаем в state И в localStorage
    state.token = token;
    state.user = user;

    localStorage.setItem('cyber_token', token);
    localStorage.setItem('cyber_user', JSON.stringify(user));

    // 🔐 Проверяем, что всё сохранилось
    console.log('✅ Токен в state:', !!state.token);
    console.log('✅ Токен в localStorage:', !!localStorage.getItem('cyber_token'));
    console.log('✅ User в state:', !!state.user);

    // 🔐 Проверяем формат токена (JWT начинается с "ey")
    if (token && !token.startsWith('ey')) {
        console.warn('⚠️ Подозрительный формат токена:', token.substring(0, 15));
    }
}

function logout() {
    console.log('🚪 logout() вызвана');
    state.token = null;
    state.user = null;
    localStorage.removeItem('cyber_token');
    localStorage.removeItem('cyber_user');
    showScreen('auth-screen');
}

// === Переключение экранов ===
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    console.log(`🖥️ Показан экран: ${screenId}`);
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(viewId);
    if (view) view.classList.add('active');
    console.log(`👁️ Показан view: ${viewId}`);
}

// === Обновление шапки ===
function updateHeader() {
    if (!state.user) return;

    const repEl = document.getElementById('rep-value');
    const leagueEl = document.getElementById('league-name');
    const iconEl = document.querySelector('.league-icon');

    if (repEl) repEl.textContent = state.user.reputation || 500;
    if (leagueEl) leagueEl.textContent = state.user.league || 'Новичок';

    const icons = {
        'Новичок': '🌱', 'Средний': '📗', 'Продвинутый': '📘',
        'Эксперт': '🎓', 'Мастер': '🏅', 'Легенда': '👑'
    };
    if (iconEl) iconEl.textContent = icons[state.user.league] || '🌱';
}

// === Загрузка сценариев ===
async function loadScenarios() {
    try {
        console.log('📥 Загрузка сценариев...');
        state.scenarios = await apiCall('/api/game/scenarios');
        console.log(`✅ Загружено сценариев: ${state.scenarios.length}`);
        updateLocationsProgress();
    } catch (error) {
        console.error('❌ Не удалось загрузить сценарии:', error);
    }
}

function updateLocationsProgress() {
    const locations = ['Офис', 'Дом', 'Общественный Wi-Fi', 'Улица'];
    locations.forEach(loc => {
        const locScenarios = state.scenarios.filter(s => s.location === loc);
        const card = document.querySelector(`.location-card[data-location="${loc}"]`);
        if (!card) return;

        const completed = locScenarios.filter(s => {
            if (!state.user?.id) return false;
            const key = `progress_${state.user.id}_${s.id}`;
            const p = localStorage.getItem(key);
            return p && JSON.parse(p).completed;
        }).length;

        const countEl = card.querySelector('.location-count');
        const fillEl = card.querySelector('.progress-fill');
        if (countEl) countEl.textContent = `${completed}/${locScenarios.length} пройдено`;
        if (fillEl) fillEl.style.width = locScenarios.length > 0 ? `${(completed/locScenarios.length)*100}%` : '0%';
    });
}

function loadScenariosForLocation(location) {
    console.log(`📍 Загрузка сценариев для: ${location}`);
    const filtered = state.scenarios.filter(s => s.location === location);
    const listEl = document.getElementById('scenarios-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    document.getElementById('location-title').textContent = `${location} — Сценарии`;

    const typeIcons = {
        'Фишинг': '📧', 'Подбор пароля': '🔑', 'MITM-атака': '📡',
        'Социальная инженерия': '📞', 'Дипфейк': '🎭', 'Скимминг': '💳', 'QR-фишинг': '📱'
    };

    filtered.forEach(scenario => {
        if (!state.user?.id) return;
        const key = `progress_${state.user.id}_${scenario.id}`;
        const progress = localStorage.getItem(key);
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

    state.currentLocation = location;
    showView('scenarios-view');
}

// === Запуск сценария ===
function startScenario(scenario) {
    console.log(`🎮 Запуск сценария #${scenario.id}: ${scenario.title}`);
    state.currentScenario = scenario;

    document.getElementById('game-level').textContent = `Уровень ${scenario.level}`;
    document.getElementById('game-type').textContent = scenario.attack_type;
    document.getElementById('scenario-title').textContent = scenario.title;
    document.getElementById('scenario-narrative').textContent = scenario.narrative;

    // Скрываем все симуляции
    ['email-sim', 'phone-sim', 'atm-sim', 'wifi-sim'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    showScenarioSimulation(scenario);
    renderChoices(scenario.choices);

    const overlay = document.getElementById('result-overlay');
    if (overlay) overlay.style.display = 'none';

    showView('game-view');
}

function showScenarioSimulation(scenario) {
    switch (scenario.attack_type) {
        case 'Фишинг':
            const emailSim = document.getElementById('email-sim');
            if (emailSim) {
                emailSim.style.display = 'block';
                document.getElementById('email-from').textContent = 'it-support@company-portal.ru';
                document.getElementById('email-subject').textContent = 'СРОЧНО: Обновите пароль';
                document.getElementById('email-body-sim').innerHTML = `
                    <p>Уважаемый сотрудник,</p>
                    <p>В связи с обновлением системы безопасности, вам необходимо обновить пароль.</p>
                    <p>Перейдите по ссылке: <span class="fake-link">https://company-portal.ru/auth/reset</span></p>
                `;
            }
            break;
        case 'Социальная инженерия':
        case 'Дипфейк':
            const phoneSim = document.getElementById('phone-sim');
            if (phoneSim) {
                phoneSim.style.display = 'flex';
                const caller = scenario.attack_type === 'Дипфейк' ? 'Генеральный директор' : 'Служба безопасности банка';
                const avatar = scenario.attack_type === 'Дипфейк' ? '👔' : '🏦';
                phoneSim.querySelector('.caller-info').innerHTML = `
                    <div class="caller-avatar">${avatar}</div>
                    <div class="caller-name">${caller}</div>
                    <div class="caller-status">Входящий звонок...</div>
                `;
            }
            break;
        case 'Скимминг':
            const atmSim = document.getElementById('atm-sim');
            if (atmSim) {
                atmSim.style.display = 'block';
                document.getElementById('atm-card-slot')?.classList.add('suspicious');
            }
            break;
        case 'MITM-атака':
            const wifiSim = document.getElementById('wifi-sim');
            if (wifiSim) {
                wifiSim.style.display = 'block';
                document.getElementById('wifi-warning').textContent = '⚠️ Подозрительная активность в сети';
            }
            break;
    }
}

function renderChoices(choices) {
    const grid = document.getElementById('choices-grid');
    if (!grid) return;
    grid.innerHTML = '';

    choices.forEach((choice, index) => {
        const card = document.createElement('div');
        card.className = 'choice-card';
        card.dataset.choiceId = choice.id;
        card.innerHTML = `
            <span class="choice-number">${index + 1}</span>
            <span class="choice-text">${choice.choice_text}</span>
        `;
        card.addEventListener('click', () => submitChoice(choice.id, card));
        grid.appendChild(card);
    });
}

// === 🔥 КРИТИЧЕСКАЯ ФУНКЦИЯ: Отправка выбора ===
async function submitChoice(choiceId, cardElement) {
    console.log('🎯 submitChoice вызвана');

    // 🔐 КРИТИЧЕСКАЯ ПРОВЕРКА: есть ли токен ПЕРЕД запросом?
    const token = state.token || localStorage.getItem('cyber_token');
    if (!token) {
        console.error('❌ submitChoice: НЕТ ТОКЕНА! Перенаправляем на вход...');
        alert('⚠️ Сессия не активна. Пожалуйста, войдите в аккаунт.');
        showScreen('auth-screen');
        return;
    }
    console.log('✅ Токен есть, продолжаем...');

    // Проверка состояния сценария
    if (!state.currentScenario?.id) {
        console.error('❌ Нет активного сценария!');
        alert('Ошибка: сценарий не загружен');
        return;
    }

    // Блокируем карточки во время запроса
    document.querySelectorAll('.choice-card').forEach(c => c.classList.add('disabled'));

    try {
        // 🔐 Формируем полезную нагрузку
        const payload = {
            scenario_id: state.currentScenario.id,
            choice_id: choiceId
        };
        console.log('🎮 Отправка выбора:', payload);

        // 🔐 Делаем запрос
        const result = await apiCall('/api/game/action', 'POST', payload);
        console.log('✅ Ответ сервера:', {
            correct: result.is_correct,
            rep_change: result.reputation_change
        });

        // Визуальный отклик
        cardElement.classList.add(result.is_correct ? 'correct' : 'wrong');

        // Сохраняем прогресс
        if (state.user?.id && state.currentScenario?.id) {
            const key = `progress_${state.user.id}_${state.currentScenario.id}`;
            localStorage.setItem(key, JSON.stringify({
                completed: result.scenario_completed,
                score: result.reputation_change > 0 ? 100 : 0,
                timestamp: Date.now()
            }));
            console.log('💾 Прогресс сохранён:', key);
        }

        // Обновляем репутацию в state и localStorage
        if (state.user) {
            const newRep = Math.max(0, state.user.reputation + result.reputation_change);
            state.user.reputation = newRep;
            localStorage.setItem('cyber_user', JSON.stringify(state.user));
            updateHeader();
            console.log(`⭐ Репутация: ${state.user.reputation}`);
        }

        // Показываем результат с небольшой задержкой для анимации
        setTimeout(() => showResult(result), 600);

    } catch (error) {
        console.error('❌ Ошибка в submitChoice:', error);

        // Разблокируем карточки
        document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('disabled'));

        // Обработка 401 — НЕ делаем авто-логин, а показываем ошибку
        if (error.message?.includes('401') || error.message?.includes('authenticated')) {
            console.warn('⚠️ 401 в submitChoice — показываем ошибку пользователю');
            alert('⚠️ Сессия истекла. Пожалуйста, войдите в аккаунт заново.');
            // Не вызываем logout() автоматически — пусть пользователь сам решит
        } else {
            alert(error.message || 'Ошибка соединения с сервером');
        }
    }
}

// === Показ результата ===
function showResult(result) {
    const overlay = document.getElementById('result-overlay');
    if (!overlay) return;

    const iconEl = document.getElementById('result-icon');
    const titleEl = document.getElementById('result-title');
    const feedbackEl = document.getElementById('result-feedback');
    const repChangeEl = document.getElementById('rep-change');
    const animContainer = document.getElementById('consequence-animation');
    const learningSection = document.getElementById('learning-section');
    const stepsList = document.getElementById('protection-steps');

    if (result.is_correct) {
        iconEl.textContent = '✅';
        titleEl.textContent = 'Отличное решение!';
        titleEl.style.color = 'var(--md-sys-color-success, #0d652d)';
        repChangeEl.textContent = `+${result.reputation_change} репутации`;
        repChangeEl.className = 'rep-change positive';
        if (animContainer) animContainer.style.display = 'none';
    } else {
        iconEl.textContent = '❌';
        titleEl.textContent = 'Неверное решение';
        titleEl.style.color = 'var(--md-sys-color-error, #b00020)';
        repChangeEl.textContent = `${result.reputation_change} репутации`;
        repChangeEl.className = 'rep-change negative';
        if (animContainer) {
            animContainer.style.display = 'block';
            playConsequenceAnimation(result.consequence_animation);
        }
    }

    feedbackEl.textContent = result.feedback;

    if (learningSection) {
        learningSection.style.display = 'block';
        if (stepsList) {
            stepsList.innerHTML = '';
            (result.protection_steps || []).forEach(step => {
                const li = document.createElement('li');
                li.textContent = step;
                stepsList.appendChild(li);
            });
        }
        const cweRef = document.getElementById('cwe-ref');
        const owaspRef = document.getElementById('owasp-ref');
        if (cweRef) cweRef.textContent = result.cwe_info || '—';
        if (owaspRef) owaspRef.textContent = result.owasp_info || '—';
    }

    overlay.style.display = 'flex';
    console.log('📊 Результат показан пользователю');
}

// === Анимация последствий ===
function playConsequenceAnimation(type) {
    const container = document.getElementById('hack-anim');
    if (!container) return;

    const animations = {
        'data_loss': ['> Перехват учётных данных...', '> Доступ к аккаунту получен...', '> Рассылка фишинга от вашего имени...'],
        'mitm_capture': ['> MITM-атака активна...', '> Трафик перехвачен...', '> Данные скомпрометированы...'],
        'money_stolen': ['> Использование CVV...', '> Перевод средств...', '> Деньги у мошенников...'],
        'deepfake_loss': ['> Дипфейк-атака...', '> Перевод по поддельному запросу...', '> Средства потеряны...'],
        'skimmer_copy': ['> Скиммер активирован...', '> Данные карты скопированы...', '> Клон карты создан...'],
        'qr_phish': ['> Переход по фишинговой ссылке...', '> Ввод данных на поддельном сайте...', '> Данные украдены...'],
        'spread': ['> Письмо переслано...', '> Коллеги перешли по ссылке...', '> Массовая компрометация...'],
    };

    const lines = animations[type] || ['> Неизвестная угроза...', '> Анализ...'];
    container.innerHTML = '';

    lines.forEach((line, i) => {
        const div = document.createElement('div');
        div.className = 'hack-line';
        div.textContent = line;
        div.style.animationDelay = `${i * 0.4}s`;
        container.appendChild(div);
    });
}

// === Загрузка статистики ===
async function loadStats() {
    try {
        console.log('📊 Загрузка статистики...');
        const stats = await apiCall('/api/stats/');

        document.getElementById('stat-completed').textContent = stats.completed_scenarios || 0;
        document.getElementById('stat-rate').textContent = (stats.success_rate || 0) + '%';
        document.getElementById('stat-rep').textContent = stats.current_reputation || 0;
        document.getElementById('stat-league').textContent = stats.league || 'Новичок';

        const barFill = document.getElementById('league-bar-fill');
        if (barFill) barFill.style.width = ((stats.league_progress || 0) * 100) + '%';

        // Обновляем пользователя в state
        if (state.user) {
            state.user.reputation = stats.current_reputation;
            state.user.league = stats.league;
            localStorage.setItem('cyber_user', JSON.stringify(state.user));
            updateHeader();
        }

        // История прохождений
        const historyEl = document.getElementById('scenarios-history-list');
        if (historyEl) {
            historyEl.innerHTML = '';
            if (!stats.scenario_results?.length) {
                historyEl.innerHTML = '<p style="text-align:center;color:#999;padding:1rem;">Нет пройденных сценариев</p>';
            } else {
                stats.scenario_results.forEach(r => {
                    const scenario = state.scenarios.find(s => s.id === r.scenario_id);
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <span>${scenario?.title || `Сценарий #${r.scenario_id}`}</span>
                        <span class="history-status ${r.is_completed ? 'success' : 'failed'}">
                            ${r.is_completed ? '✅ Пройден' : '❌ Не пройден'}
                        </span>
                    `;
                    historyEl.appendChild(item);
                });
            }
        }

        // Статус сертификата
        const certEl = document.getElementById('certificate-status');
        if (certEl) {
            const total = state.scenarios.length;
            const completed = stats.completed_scenarios || 0;
            const rate = stats.success_rate || 0;

            if (rate >= 80 && completed >= total && total > 0) {
                certEl.className = 'certificate-unlocked';
                certEl.innerHTML = `
                    <div style="font-size:2rem;margin-bottom:0.5rem;">🏆</div>
                    <h3>Сертификат получен!</h3>
                    <p>Успешность: ${rate}%</p>
                    <p style="font-size:0.8rem;opacity:0.8;margin-top:0.5rem;">
                        ID: CERT-${state.user?.id || '0'}-${Date.now().toString(36).toUpperCase()}
                    </p>
                `;
            } else {
                certEl.className = 'certificate-locked';
                certEl.innerHTML = `
                    <div class="cert-lock-icon">🔒</div>
                    <p>Пройдено: ${completed}/${total}</p>
                    <p>Успешность: ${rate}% (нужно ≥ 80%)</p>
                `;
            }
        }
        console.log('✅ Статистика загружена');
    } catch (error) {
        console.error('❌ Ошибка загрузки статистики:', error);
    }
}

// === Привязка событий ===
function bindMainEvents() {
    console.log('🔗 Привязка событий...');

    // Выход
    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Статистика
    document.getElementById('btn-stats')?.addEventListener('click', async (e) => {
        e.preventDefault();
        showView('stats-view');
        await loadStats();
    });

    // Навигация
    document.getElementById('btn-back-from-stats')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('map-view');
    });

    document.getElementById('btn-back-to-map')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('map-view');
    });

    document.getElementById('btn-back-to-scenarios')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView(state.currentLocation ? 'scenarios-view' : 'map-view');
    });

    document.getElementById('btn-next-scenario')?.addEventListener('click', (e) => {
        e.preventDefault();
        const overlay = document.getElementById('result-overlay');
        if (overlay) overlay.style.display = 'none';
        if (state.currentLocation) {
            loadScenariosForLocation(state.currentLocation);
        } else {
            showView('map-view');
        }
    });

    // Локации
    document.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            loadScenariosForLocation(card.dataset.location);
        });
    });

    console.log('✅ События привязаны');
}

// === Инициализация главного приложения ===
function initMainApp() {
    console.log('🚀 initMainApp вызвана');
    showScreen('main-screen');
    updateHeader();
    loadScenarios();
    bindMainEvents();
}

// === Инициализация авторизации ===
function initAuth() {
    console.log('🔐 initAuth вызвана');

    // Переключение табов
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-form`)?.classList.add('active');
        });
    });

    // Форма входа
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Форма входа отправлена');

        const errorEl = document.getElementById('login-error');
        if (errorEl) errorEl.textContent = '';

        const username = document.getElementById('login-username')?.value.trim();
        const password = document.getElementById('login-password')?.value;

        if (!username || !password) {
            if (errorEl) errorEl.textContent = 'Заполните все поля';
            return;
        }

        try {
            console.log('📤 Login запрос...');
            const data = await apiCall('/api/auth/login', 'POST', { username, password });
            console.log('✅ Login успешен');
            login(data.access_token, data.user);
            initMainApp();
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            if (errorEl) errorEl.textContent = error.message || 'Неверный логин или пароль';
        }
    });

    // Форма регистрации
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Форма регистрации отправлена');

        const errorEl = document.getElementById('reg-error');
        if (errorEl) errorEl.textContent = '';

        const username = document.getElementById('reg-username')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;

        if (username?.length < 3) {
            if (errorEl) errorEl.textContent = 'Минимум 3 символа в имени';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
            if (errorEl) errorEl.textContent = 'Некорректный email';
            return;
        }
        if ((password?.length || 0) < 8) {
            if (errorEl) errorEl.textContent = 'Пароль минимум 8 символов';
            return;
        }

        try {
            console.log('📤 Register запрос...');
            const data = await apiCall('/api/auth/register', 'POST', { username, email, password });
            console.log('✅ Register успешен');
            login(data.access_token, data.user);
            initMainApp();
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            if (errorEl) errorEl.textContent = error.message || 'Ошибка регистрации';
        }
    });
}

// === 🐛 Глобальный отладчик fetch (только localhost) ===
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    const originalFetch = window.fetch;
    window.fetch = function(resource, config = {}) {
        const url = typeof resource === 'string' ? resource : resource.url;

        // Логируем только API-запросы
        if (url.includes('/api/')) {
            console.groupCollapsed(`🌐 ${config.method || 'GET'} ${url.replace(location.origin, '')}`);

            // Заголовки
            if (config.headers) {
                console.log('Headers:', {
                    ...config.headers,
                    Authorization: config.headers.Authorization ? 'Bearer ***' : undefined
                });
            }

            // Тело запроса
            if (config.body) {
                try {
                    console.log('Body:', JSON.parse(config.body));
                } catch {
                    console.log('Body:', config.body);
                }
            }

            console.groupEnd();
        }

        return originalFetch.apply(this, arguments);
    };
    console.log('🐛 Debug fetch interceptor enabled');
}

// === Запуск при загрузке ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded');

    // 🔐 Инициализируем состояние авторизации ПЕРВЫМ
    initAuthState();

    // Инициализируем формы авторизации
    initAuth();

    // Если уже авторизован — сразу показываем главное меню
    if (state.token && state.user) {
        console.log('✅ Авто-вход: токен и пользователь есть');
        initMainApp();
    } else {
        console.log('⏳ Ожидание входа пользователя');
    }
});

// === Экспорт для отладки в консоли ===
if (typeof window !== 'undefined') {
    window.CyberShield = {
        state,
        apiCall,
        login,
        logout,
        loadScenarios,
        loadStats
    };
    console.log('🔧 CyberShield debug API доступен: window.CyberShield');
}