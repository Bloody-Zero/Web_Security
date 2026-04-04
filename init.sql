CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    reputation INTEGER DEFAULT 500,
    league VARCHAR(20) DEFAULT 'Новичок',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    location VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    attack_type VARCHAR(50) NOT NULL,
    description TEXT,
    narrative TEXT,
    cwe_reference VARCHAR(50),
    owasp_reference VARCHAR(50),
    hint TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenario_choices (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    feedback_correct TEXT,
    feedback_wrong TEXT,
    consequence_animation VARCHAR(100),
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, scenario_id)
);

CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    choice_id INTEGER REFERENCES scenario_choices(id) ON DELETE SET NULL,
    is_correct BOOLEAN,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed scenarios
INSERT INTO scenarios (title, location, level, attack_type, description, narrative, cwe_reference, owasp_reference, hint) VALUES
('Письмо от IT-отдела', 'Офис', 1, 'Фишинг', 'Фишинговое письмо с поддельной ссылкой на сброс пароля',
 'Вы получаете письмо от "it-support@company-portal.ru" с темой "СРОЧНО: Обновите пароль до конца дня". В письме ссылка на "новый корпоративный портал".',
 'CWE-20', 'A07:2021', 'Проверьте адрес отправителя и наведите курсор на ссылку, не нажимая на неё'),

('Пароль от соцсети', 'Дом', 1, 'Подбор пароля', 'Брутфорс-атака на аккаунт с простым паролем',
 'Вы замечаете подозрительную активность в своей соцсети: от вашего имени отправлены странные сообщения друзьям. Вы используете пароль "12345678".',
 'CWE-521', 'A07:2021', 'Используйте сложные пароли минимум из 12 символов с разными типами знаков'),

('Кофейня Wi-Fi', 'Общественный Wi-Fi', 2, 'MITM-атака', 'Атака через поддельную точку доступа',
 'Вы подключаетесь к бесплатному Wi-Fi "FreeCoffee_WiFi" в кафе. Через несколько минут браузер запрашивает подтверждение пароля от почты.',
 'CWE-319', 'A02:2021', 'Никогда не вводите пароли через публичный Wi-Fi без VPN'),

('Звонок из банка', 'Дом', 2, 'Социальная инженерия', 'Звонок от мошенников с попыткой выманить данные карты',
 'Вам звонит "сотрудник службы безопасности банка" и сообщает о подозрительной операции. Просит назвать CVV-код для "отмены транзакции".',
 'CWE-74', 'A01:2021', 'Сотрудники банка НИКОГДА не спрашивают CVV-код. Положите трубку и перезвоните в банк сами'),

('Дипфейк-руководитель', 'Офис', 3, 'Дипфейк / Социальная инженерия', 'Видеозвонок с дипфейком от "генерального директора"',
 'Вам приходит видеозвонок от "генерального директора". На экране знакомое лицо. Он просит срочно перевести 500 000 ₽ на указанный счёт "для секретной сделки".',
 'CWE-288', 'A01:2021', 'Проверьте запрос через другой канал связи. Дипфейки могут имитировать голос и лицо'),

('Поддельный банкомат', 'Улица', 2, 'Скимминг', 'Скимминговое устройство на банкомате',
 'Вы вставляете карту в банкомат и замечаете, что слот для карты выглядит немного иначе — накладка кажется толще обычной.',
 'CWE-200', 'A01:2021', 'Осмотрите банкомат на наличие накладок. При сомнениях — используйте другой банкомат'),

('QR-код на парковке', 'Улица', 3, 'QR-фишинг / Quishing', 'Поддельный QR-код для оплаты парковки',
 'Вы находите наклейку с QR-кодом "Оплата парковки" на столбе. При сканировании открывается страница оплаты картой.',
 'CWE-352', 'A01:2021', 'Используйте только официальные приложения для оплаты. Не сканируйте неизвестные QR-коды');

-- Insert choices for each scenario
-- Scenario 1: Фишинг
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(1, 'Нажать на ссылку и ввести пароль', false, '',
 '⚠️ Вы попали на поддельный сайт! Злоумышленники получили ваш пароль.',
 'data_loss', 1),
(1, 'Проверить адрес отправителя и сообщить в IT-отдел по внутреннему телефону', true,
 '✅ Отлично! Адрес отправителя "company-portal.ru" отличается от настоящего "company.com". Вы сообщили в IT — фишинговая кампания заблокирована.',
 '', 'blocked', 2),
(1, 'Переслать письмо коллегам с пометкой "Важно"', false, '',
 '⚠️ Пересылая письмо, вы помогли распространить фишинг. Коллеги могли не проверить ссылку.',
 'spread', 3),
(1, 'Удалить письмо и ничего не делать', false, '',
 '⚠️ Вы в безопасности, но другие сотрудники могут попасться. Лучше сообщить в IT-отдел.',
 'partial', 4);

-- Scenario 2: Подбор пароля
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(2, 'Сменить пароль на сложный (12+ символов, разные типы) и включить 2FA', true,
 '✅ Отлично! Сложный пароль + двухфакторная аутентификация — надёжная защита. Мошенники больше не получат доступ.',
 '', 'secured', 1),
(2, 'Сменить пароль на "qwerty123"', false, '',
 '⚠️ Новый пароль слишком простой! Мошенники подберут его за секунды.',
 'repeated', 2),
(2, 'Игнорировать — авось пронесёт', false, '',
 '⚠️ Аккаунт взломан! От вашего имени разослан спам, друзья получили фишинговые ссылки.',
 'account_hijack', 3),
(2, 'Написать в поддержку соцсети', false, '',
 '⚠️ Поддержка поможет, но пока они отвечают — аккаунт уже скомпрометирован. Нужно было сменить пароль немедленно.',
 'delayed', 4);

-- Scenario 3: MITM
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(3, 'Ввести пароль — страница выглядит как настоящая', false, '',
 '⚠️ Вы ввели пароль через поддельную точку доступа! Все данные перехвачены.',
 'mitm_capture', 1),
(3, 'Отключиться от Wi-Fi, не вводить данные, включить VPN', true,
 '✅ Верно! Поддельная точка доступа "FreeCoffee_WiFi" — атака MITM. VPN шифрует трафик.',
 '', 'vpn_on', 2),
(3, 'Ввести пароль, но в режиме инкогнито', false, '',
 '⚠️ Режим инкогнито не защищает от перехвата трафика! Данные всё равно перехвачены.',
 'mitm_capture', 3),
(3, 'Попробовать подключиться к другому Wi-Fi в кафе', false, '',
 '⚠️ Все публичные точки в кафе могут быть поддельными. Безопаснее — мобильный интернет или VPN.',
 'partial', 4);

-- Scenario 4: Социальная инженерия
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(4, 'Назвать CVV-код для "отмены транзакции"', false, '',
 '⚠️ Вы сообщили CVV-код мошенникам! Со счёта списаны все средства.',
 'money_stolen', 1),
(4, 'Положить трубку, позвонить в банк по номеру на карте', true,
 '✅ Правильно! Сотрудники банка никогда не спрашивают CVV. Вы подтвердили — никакой подозрительной операции не было.',
 '', 'safe_call', 2),
(4, 'Спросить ФИО сотрудника и назвать CVV', false, '',
 '⚠️ Мошенники знают ваше ФИО из утечек данных. CVV-код нельзя сообщать никому.',
 'money_stolen', 3),
(4, 'Позвонить другу и спросить совета', false, '',
 '⚠️ Пока вы консультируетесь — мошенники могут уже оформить перевод. Нужно немедленно прекратить разговор.',
 'delayed', 4);

-- Scenario 5: Дипфейк
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(5, 'Выполнить перевод — это же директор!', false, '',
 '⚠️ Это был дипфейк! 500 000 ₽ переведены мошенникам. Видео и голос были сгенерированы ИИ.',
 'deepfake_loss', 1),
(5, 'Перезвонить директору по известному номеру для подтверждения', true,
 '✅ Верно! Реальный директор ничего не переводил. Дипфейк раскрыт. Вы предотвратили мошенничество.',
 '', 'deepfake_caught', 2),
(5, 'Попросить "директора" назвать кодовое слово', false, '',
 '⚠️ Мошенники могут знать кодовые слова из утечек. Нужна проверка через независимый канал.',
 'partial', 3),
(5, 'Перевести деньги, но только половину суммы', false, '',
 '⚠️ Любая сумма — это мошенничество. Дипфейк раскрыт постфактум.',
 'deepfake_loss', 4);

-- Scenario 6: Скимминг
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(6, 'Вставить карту — может это нормально', false, '',
 '⚠️ Скиммер скопировал данные вашей карты! Через неделю все деньги списаны.',
 'skimmer_copy', 1),
(6, 'Не использовать банкомат, сообщить в банк и найти другой', true,
 '✅ Верно! Накладка — скиммер. Вы предотвратили кражу данных карты.',
 '', 'skimmer_reported', 2),
(6, 'Попробовать снять деньги через другой слот', false, '',
 '⚠️ Скиммер может быть установлен на любом слоте. Безопаснее — другой банкомат.',
 'skimmer_copy', 3),
(6, 'Отойти и ничего не делать', false, '',
 '⚠️ Вы в безопасности, но следующий человек может стать жертвой. Сообщите в банк.',
 'partial', 4);

-- Scenario 7: QR-фишинг
INSERT INTO scenario_choices (scenario_id, choice_text, is_correct, feedback_correct, feedback_wrong, consequence_animation, sort_order) VALUES
(7, 'Отсканировать и оплатить — это же на столбе', false, '',
 '⚠️ QR-код ведёт на фишинговый сайт! Данные карты перехвачены.',
 'qr_phish', 1),
(7, 'Не сканировать, оплатить через официальное приложение парковки', true,
 '✅ Верно! QR-код наклеен мошенниками. Вы использовали безопасный способ оплаты.',
 '', 'qr_safe', 2),
(7, 'Отсканировать, но не вводить данные карты', false, '',
 '⚠️ Даже сканирование может запустить вредоносный скрипт или установить приложение.',
 'qr_phish', 3),
(7, 'Сфотографировать QR-код и отправить другу', false, '',
 '⚠️ Друг может отсканировать и попасться. Лучше сообщить о подозрительной наклейке.',
 'spread', 4);