// === Game Engine ===

function startScenario(scenario) {
    state.currentScenario = scenario;

    // Заполняем игровой экран
    document.getElementById('game-level').textContent = `Уровень ${scenario.level}`;
    document.getElementById('game-type').textContent = scenario.attack_type;
    document.getElementById('scenario-title').textContent = scenario.title;
    document.getElementById('scenario-narrative').textContent = scenario.narrative;

    // Скрываем все симуляции
    document.getElementById('email-sim').style.display = 'none';
    document.getElementById('phone-sim').style.display = 'none';
    document.getElementById('atm-sim').style.display = 'none';
    document.getElementById('wifi-sim').style.display = 'none';

    // Показываем релевантную симуляцию
    showScenarioSimulation(scenario);

    // Заполняем варианты выбора
    renderChoices(scenario.choices);

    // Скрываем результат
    document.getElementById('result-overlay').style.display = 'none';

    showView('game-view');
}

function showScenarioSimulation(scenario) {
    switch (scenario.attack_type) {
        case 'Фишинг':
            const emailSim = document.getElementById('email-sim');
            emailSim.style.display = 'block';
            document.getElementById('email-from').textContent = 'it-support@company-portal.ru';
            document.getElementById('email-subject').textContent = 'СРОЧНО: Обновите пароль до конца дня';
            document.getElementById('email-body-sim').innerHTML = `
                <p>Уважаемый сотрудник,</p>
                <p>В связи с обновлением системы безопасности, вам необходимо обновить пароль для доступа к корпоративному порталу.</p>
                <p>Пожалуйста, перейдите по ссылке: <span class="fake-link">https://company-portal.ru/auth/reset</span></p>
                <p><em>Срок действия ссылки — 24 часа.</em></p>
                <p style="margin-top:1rem;font-size:0.85rem;color:#666;">С уважением, IT-отдел</p>
            `;
            break;

        case 'Социальная инженерия':
            const phoneSim = document.getElementById('phone-sim');
            phoneSim.style.display = 'flex';
            document.getElementById('caller-name').textContent = 'Служба безопасности';
            document.getElementById('phone-sim').querySelector('.caller-info').innerHTML = `
                <div class="caller-avatar">🏦</div>
                <div class="caller-name">Служба безопасности банка</div>
                <div class="caller-status">Входящий звонок...</div>
            `;
            break;

        case 'Дипфейк':
            const phoneSim2 = document.getElementById('phone-sim');
            phoneSim2.style.display = 'flex';
            document.getElementById('phone-sim2').querySelector('.caller-info').innerHTML = `
                <div class="caller-avatar">👔</div>
                <div class="caller-name">Генеральный директор</div>
                <div class="caller-status">Видеозвонок...</div>
            `;
            break;

        case 'Скимминг':
            const atmSim = document.getElementById('atm-sim');
            atmSim.style.display = 'block';
            document.getElementById('atm-card-slot').classList.add('suspicious');
            break;

        case 'MITM-атака':
            const wifiSim = document.getElementById('wifi-sim');
            wifiSim.style.display = 'block';
            document.getElementById('wifi-warning').textContent = '⚠️ Обнаружена подозрительная активность в сети';
            break;
    }
}

function renderChoices(choices) {
    const grid = document.getElementById('choices-grid');
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

async function submitChoice(choiceId, cardElement) {
    // Блокируем все карточки
    document.querySelectorAll('.choice-card').forEach(c => c.classList.add('disabled'));

    try {
        const result = await apiCall('/api/game/action', 'POST', {
            scenario_id: state.currentScenario.id,
            choice_id: choiceId
        });

        // Обновляем UI карточки
        if (result.is_correct) {
            cardElement.classList.add('correct');
        } else {
            cardElement.classList.add('wrong');
            // Показываем правильный ответ
            document.querySelectorAll('.choice-card').forEach(c => {
                // В реальном приложении мы бы знали правильный ответ заранее
                // Для демо подсвечиваем правильный через API
            });
        }

        // Сохраняем прогресс
        localStorage.setItem(`progress_${state.user.id}_${state.currentScenario.id}`, JSON.stringify({
            completed: result.scenario_completed,
            score: result.reputation_change > 0 ? 100 : 0
        }));

        // Обновляем репутацию в стейте
        state.user.reputation += result.reputation_change;
        localStorage.setItem('user', JSON.stringify(state.user));
        updateHeader();

        // Задержка перед показом результата
        setTimeout(() => {
            showResult(result);
        }, 800);

    } catch (error) {
        console.error('Failed to submit choice:', error);
        document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('disabled'));
    }
}

function showResult(result) {
    const overlay = document.getElementById('result-overlay');
    const iconEl = document.getElementById('result-icon');
    const titleEl = document.getElementById('result-title');
    const feedbackEl = document.getElementById('result-feedback');
    const repChangeEl = document.getElementById('rep-change');
    const animContainer = document.getElementById('consequence-animation');
    const learningSection = document.getElementById('learning-section');
    const stepsList = document.getElementById('protection-steps');
    const cweRef = document.getElementById('cwe-ref');
    const owaspRef = document.getElementById('owasp-ref');

    if (result.is_correct) {
        iconEl.textContent = '✅';
        titleEl.textContent = 'Отличное решение!';
        titleEl.style.color = 'var(--md-sys-color-success)';
        feedbackEl.textContent = result.feedback;
        repChangeEl.textContent = `+${result.reputation_change} репутации`;
        repChangeEl.className = 'rep-change positive';
        animContainer.style.display = 'none';
    } else {
        iconEl.textContent = '❌';
        titleEl.textContent = 'Неверное решение';
        titleEl.style.color = 'var(--md-sys-color-error)';
        feedbackEl.textContent = result.feedback;
        repChangeEl.textContent = `${result.reputation_change} репутации`;
        repChangeEl.className = 'rep-change negative';

        // Показываем анимацию последствий
        animContainer.style.display = 'block';
        playConsequenceAnimation(result.consequence_animation);
    }

    // Алгоритм защиты
    learningSection.style.display = 'block';
    stepsList.innerHTML = '';
    (result.protection_steps || []).forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
    });

    cweRef.textContent = result.cwe_info || '—';
    owaspRef.textContent = result.owasp_info || '—';

    overlay.style.display = 'flex';
}

function playConsequenceAnimation(type) {
    const container = document.getElementById('hack-anim');
    const animations = {
        'data_loss': [
            '> Подключение к серверу злоумышленника...',
            '> Передача данных: login, password...',
            '> Данные успешно перехвачены!',
            '> Доступ к аккаунту получен...',
            '> Отправка фишинговых писем от вашего имени...'
        ],
        'mitm_capture': [
            '> Перехват трафика: MITM-атака активна',
            '> Захват HTTP-запросов...',
            '> Получены: login, password, session_id',
            '> Создание поддельной сессии...',
            '> Доступ к аккаунту без 2FA...'
        ],
        'money_stolen': [
            '> Использование CVV-кода...',
            '> Инициализация онлайн-перевода...',
            '> Подтверждение транзакции...',
            '> Перевод: 150 000 ₽ на счёт мошенников',
            '> Блокировка карты через 2 часа...'
        ],
        'deepfake_loss': [
            '> Инициация перевода по указанным реквизитам...',
            '> Перевод: 500 000 ₽',
            '> Подтверждение по SMS...',
            '> Средства зачислены на счёт мошенников',
            '> Дипфейк обнаружен через 3 часа...'
        ],
        'skimmer_copy': [
            '> Скиммер активирован...',
            '> Копирование данных магнитной полосы...',
            '> Запись данных на клон карты...',
            '> Снятие наличных в другом городе...',
            '> Обнаружено через 2 дня...'
        ],
        'qr_phish': [
            '> Переход по ссылке из QR-кода...',
            '> Загрузка фишинговой страницы...',
            '> Ввод данных карты...',
            '> Данные отправлены на сервер C2...',
            '> Списание средств через 1 час...'
        ],
        'spread': [
            '> Пересылка письма 5 контактам...',
            '> 3 контакта перешли по ссылке...',
            '> Сбор учётных данных...',
            '> Массовая фишинговая кампания...',
            '> Блокировка IT-отделом через 6 часов...'
        ],
        'repeated': [
            '> Новый пароль слишком простой...',
            '> Словарная атака: 1000 попыток/сек...',
            '> Пароль подобран за 0.003 сек',
            '> Повторный доступ к аккаунту...',
            '> Блокировка аккаунта...'
        ],
        'account_hijack': [
            '> Брутфорс-атака на аккаунт...',
            '> Пароль подобран: "12345678"',
            '> Смена привязанного email...',
            '> Рассылка спама друзьям...',
            '> Восстановление через поддержку (3 дня)...'
        ],
        'delayed': [
            '> Время упущено...',
            '> Мошенники успели сменить пароль...',
            '> Привязка нового email...',
            '> Отправка фишинга от вашего имени...',
            '> Блокировка аккаунта...'
        ],
        'vpn_on': [],
        'safe_call': [],
        'secured': [],
        'blocked': [],
        'partial': ['> Частичная защита: вы не пострадали, но и не помогли другим.'],
        'deepfake_caught': [],
        'skimmer_reported': [],
        'qr_safe': []
    };

    const lines = animations[type] || ['> Неизвестная угроза...', '> Анализ ситуации...'];
    container.innerHTML = '';

    lines.forEach((line, i) => {
        const div = document.createElement('div');
        div.className = 'hack-line';
        div.textContent = line;
        div.style.animationDelay = `${i * 0.5}s`;
        container.appendChild(div);
    });
}