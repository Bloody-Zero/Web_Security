Реализованная функциональность
Функционал 1: Интерактивные сценарии кибератак
Пользователь попадает в реалистичную среду (Офис, Дом, Общественный Wi-Fi, Улица)
Столкновение с 7 типами атак: Фишинг, Подбор пароля, MITM, Социальная инженерия, Дипфейк, Скимминг, QR-фишинг
Выбор из 3-4 вариантов действий с мгновенной валидацией и обратной связью
Функционал 2: Система обучения через действие
При ошибке — пошаговая анимация последствий взлома (терминал-стиль)
При успехе — алгоритм защиты из 3-5 шагов с ссылками на CWE и OWASP
Контекстные подсказки и справка по уязвимостям
Функционал 3: Геймификация и прогресс
Шкала репутации (0–2000+): +50 за верное решение, -30 за ошибку
Система лиг: Новичок → Средний → Продвинутый → Эксперт → Мастер → Легенда
Личный кабинет со статистикой: пройденные сценарии, % успешности, история действий
Верифицированный сертификат с QR-кодом при достижении 80% успешности
Особенность проекта в следующем:
Киллерфича-1: Обучение без реальных угроз
Все атаки симулированы на уровне интерфейса и текста
Никаких реальных вредоносных файлов, скриптов или эксплойтов
Безопасная среда для отработки навыков цифровой гигиены
Киллерфича-2: Адаптивная визуализация последствий
Уникальная система анимаций «взлома» в стиле терминала
Каждый тип атаки имеет собственный сценарий последствий
Эмоциональное вовлечение через наглядную демонстрацию рисков
Киллерфича-3: Готовность к эволюции угроз
Модульная архитектура сценариев: новый тип атаки добавляется через JSON/SQL
API-интерфейс для импорта реальных кейсов от партнёров (Минцифры, Касперский)
Интеграция с базами CWE, OWASP Top 10, APWG для актуальности контента
Основной стек технологий

Особенность проекта в следующем:
Киллерфича-1: Обучение без реальных угроз
Все атаки симулированы на уровне интерфейса и текста
Никаких реальных вредоносных файлов, скриптов или эксплойтов
Безопасная среда для отработки навыков цифровой гигиены
Киллерфича-2: Адаптивная визуализация последствий
Уникальная система анимаций «взлома» в стиле терминала
Каждый тип атаки имеет собственный сценарий последствий
Эмоциональное вовлечение через наглядную демонстрацию рисков
Киллерфича-3: Готовность к эволюции угроз
Модульная архитектура сценариев: новый тип атаки добавляется через JSON/SQL
API-интерфейс для импорта реальных кейсов от партнёров (Минцифры, Касперский)
Интеграция с базами CWE, OWASP Top 10, APWG для актуальности контента

Основной стек технологий
🐍 Язык: Python 3.11
🚀 Бэкенд: FastAPI 0.109.0, Uvicorn
🗄️ База данных: PostgreSQL 15 (Alpine), SQLAlchemy 2.0 (Async)
🔐 Безопасность: passlib[bcrypt], python-jose (JWT), HTTPBearer
🌐 Фронтенд: HTML5, CSS3 (Material Design 3), Vanilla JavaScript
🐳 Контейнеризация: Docker, Docker Compose v3.8
📡 API: OpenAPI 3.0 (Swagger UI автогенерация)
🔧 Сборка: pip, docker build (без Webpack/Gulp — минимализм)
📦 Зависимости: asyncpg, pydantic, python-multipart

Демо
🌐 Демо сервиса доступно по адресу: http://localhost:8000
(после запуска через docker-compose)
https://www.figma.com/community/file/1622446824315997910

СРЕДА ЗАПУСКА
Развертывание сервиса производится в контейнерах Docker, что обеспечивает:

📚 API Документация:
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
OpenAPI JSON: http://localhost:8000/openapi.json

УСТАНОВКА
Установка через Docker (рекомендуемый способ)
# 1. Клонируйте репозиторий
git clone <repository-url>
cd cyber-shield-simulator

# 2. Запустите проект одной командой
docker-compose up -d --build

# 3. Дождитесь готовности (проверка логов)
docker-compose logs -f backend
# Ожидайте: "INFO: Application startup complete."

# 4. Откройте в браузере
# → http://localhost:8000

Установка вручную (для разработки)
# 1. Подготовка окружения
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y python3.11 python3.11-venv postgresql postgresql-contrib git

# 2. Клонирование проекта
git clone <repository-url>
cd cyber-shield-simulator

# 3. Создание виртуального окружения
python3.11 -m venv .venv
source .venv/bin/activate

# 4. Установка зависимостей бэкенда
pip install -r backend/requirements.txt

# 5. Настройка БД (см. раздел "База данных" ниже)

# 6. Запуск сервера разработки
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

База данных
Настройка PostgreSQL в Docker (автоматически)
При запуске docker-compose up:
Создаётся база cyber_sim
Создаётся пользователь cyber_user с паролем cyber_pass_2024
Выполняются миграции из init.sql (таблицы + тестовые данные)

Ручная настройка 
# 1. Запуск PostgreSQL
sudo systemctl start postgresql
sudo -u postgres psql

# 2. Создание БД и пользователя
CREATE DATABASE cyber_sim;
CREATE USER cyber_user WITH PASSWORD 'cyber_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE cyber_sim TO cyber_user;
\q

# 3. Применение миграций
psql -U cyber_user -d cyber_sim -f init.sql

# 4. Настройка подключения в .env (опционально)
# Создайте файл backend/.env:
echo "DATABASE_URL=postgresql+asyncpg://cyber_user:cyber_pass_2024@localhost:5432/cyber_sim" > backend/.env
echo "SECRET_KEY=your-dev-secret-key-here" >> backend/.env
# 1. Запуск PostgreSQL
sudo systemctl start postgresql
sudo -u postgres psql

# 2. Создание БД и пользователя
CREATE DATABASE cyber_sim;
CREATE USER cyber_user WITH PASSWORD 'cyber_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE cyber_sim TO cyber_user;
\q

# 3. Применение миграций
psql -U cyber_user -d cyber_sim -f init.sql

# 4. Настройка подключения в .env (опционально)
# Создайте файл backend/.env:
echo "DATABASE_URL=postgresql+asyncpg://cyber_user:cyber_pass_2024@localhost:5432/cyber_sim" > backend/.env
echo "SECRET_KEY=your-dev-secret-key-here" >> backend/.env

Установка зависимостей проекта
Бэкенд (Python)
# Через pip (в виртуальном окружении)
pip install -r backend/requirements.txt

# Зависимости:
# fastapi, uvicorn, sqlalchemy[asyncio], asyncpg,
# python-jose[cryptography], passlib[bcrypt], bcrypt==3.2.2,
# pydantic, pydantic-settings, python-multipart

Выполнение миграций
В Docker (автоматически)
Миграции выполняются при старте приложения через lifespan в backend/main.py:
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # ← Создание таблиц
    yield
    
Вручную
# Активировать окружение
source .venv/bin/activate

# Запустить создание таблиц через Python
python -c "
import asyncio
from backend.database import engine, Base

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
asyncio.run(init())
print('✅ Миграции применены')
"
Установка зависимостей проекта
Установка зависимостей осуществляется с помощью Composer. Если у вас его нет вы можете установить его по инструкции на getcomposer.org.

После этого выполнить команду в директории проекта:

composer install

Разработчики
Куприяненко Светлана Эдуардовна  fullstack teamlead
Ватулин Алексей Сергеевич
Агафонцев Всеволод
Панфилов Юрий Игоревич
