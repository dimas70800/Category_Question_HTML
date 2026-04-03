// Хранилище данных (все автоматически сохраняется в localStorage)
class StorageManager {
    constructor() {
        this.storagePrefix = 'quiz_';
    }

    // Сохранение всех категорий
    saveAllCategories(categories) {
        localStorage.setItem(`${this.storagePrefix}categories`, JSON.stringify(categories.map(c => c.toJSON())));
    }

    // Загрузка всех категорий
    loadAllCategories() {
        const data = localStorage.getItem(`${this.storagePrefix}categories`);
        if (!data) return [];
        const parsed = JSON.parse(data);
        return parsed.map(c => Category.fromJSON(c));
    }

    // Сохранение пользователей
    saveAllUsers(users) {
        localStorage.setItem(`${this.storagePrefix}users`, JSON.stringify(users.map(u => u.toJSON())));
    }

    // Загрузка пользователей
    loadAllUsers() {
        const data = localStorage.getItem(`${this.storagePrefix}users`);
        if (!data) {
            // Создаем пользователей по умолчанию
            const defaultUsers = [
                new User("user", "1234", "Tested", 0),
                new User("user2", "1234", "Tested", 0),
                new User("adm", "1234", "Admin", 0)
            ];
            this.saveAllUsers(defaultUsers);
            return defaultUsers;
        }
        const parsed = JSON.parse(data);
        return parsed.map(u => User.fromJSON(u));
    }

    // Сохранение прогресса пользователя
    saveUserProgress(progress) {
        localStorage.setItem(`${this.storagePrefix}progress_${progress.Login}`, JSON.stringify(progress.toJSON()));
    }

    // Загрузка прогресса пользователя
    loadUserProgress(login) {
        const data = localStorage.getItem(`${this.storagePrefix}progress_${login}`);
        if (!data) return new UserProgress(login);
        const parsed = JSON.parse(data);
        return UserProgress.fromJSON(parsed);
    }

    // Сохранение детального лога
    saveLog(logEntry) {
        let logs = this.loadAllLogs();
        logs.unshift(logEntry);
        if (logs.length > 200) logs = logs.slice(0, 200);
        localStorage.setItem(`${this.storagePrefix}logs`, JSON.stringify(logs));
    }

    // Загрузка всех логов
    loadAllLogs() {
        const data = localStorage.getItem(`${this.storagePrefix}logs`);
        if (!data) return [];
        return JSON.parse(data);
    }

    // Очистка логов
    clearLogs() {
        localStorage.setItem(`${this.storagePrefix}logs`, JSON.stringify([]));
    }

    // Сброс прогресса пользователя
    resetUserProgress(login, categoryName = null) {
        const progress = this.loadUserProgress(login);

        if (categoryName) {
            // Сброс только по категории
            delete progress.ResolvedQuestions[categoryName];
        } else {
            // Полный сброс
            progress.ResolvedQuestions = {};
            progress.Score = 0;
        }

        this.saveUserProgress(progress);

        // Логируем сброс
        this.saveLog({
            type: 'reset',
            username: login,
            category: categoryName || 'all',
            date: new Date().toISOString(),
            message: categoryName ? `Сброшен прогресс по категории "${categoryName}"` : 'Сброшен весь прогресс'
        });

        return progress;
    }

    // Создание базовых категорий (только при первом запуске) - 10 вопросов в каждой
    createBaseCategoriesIfNeeded() {
        const existing = this.loadAllCategories();
        if (existing.length > 0) return existing;

        const categories = [];

        // Категория Математика - 10 вопросов
        const mathCategory = new Category("Математика");

        mathCategory.addQuestion(new Question("Сколько будет 2 + 1?", ["4", "5", "3", "2"], 2, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 2?", ["4", "3", "5", "6"], 0, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 3?", ["6", "5", "4", "7"], 1, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 4?", ["5", "7", "8", "6"], 3, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 5?", ["8", "6", "7", "9"], 2, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 6?", ["8", "9", "7", "10"], 0, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 7?", ["10", "9", "8", "11"], 1, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 8?", ["9", "11", "12", "10"], 3, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 9?", ["10", "12", "11", "13"], 2, 10));
        mathCategory.addQuestion(new Question("Сколько будет 2 + 10?", ["11", "12", "13", "14"], 1, 10));

        categories.push(mathCategory);

        // Категория География - 10 вопросов
        const geographyCategory = new Category("География");
        geographyCategory.addQuestion(new Question("Столица России?", ["Санкт-Петербург", "Москва", "Казань", "Новосибирск"], 1, 10));
        geographyCategory.addQuestion(new Question("Самая длинная река в мире?", ["Нил", "Амазонка", "Миссисипи", "Янцзы"], 1, 10));
        geographyCategory.addQuestion(new Question("Самая высокая гора?", ["К2", "Эверест", "Лхоцзе", "Канченджанга"], 1, 10));
        geographyCategory.addQuestion(new Question("Самое большое озеро?", ["Верхнее", "Виктория", "Гурон", "Каспийское море"], 3, 10));
        geographyCategory.addQuestion(new Question("Самая маленькая страна?", ["Монако", "Сан-Марино", "Ватикан", "Лихтенштейн"], 2, 10));
        geographyCategory.addQuestion(new Question("Самый густонаселенный город?", ["Дели", "Шанхай", "Сан-Паулу", "Токио"], 3, 10));
        geographyCategory.addQuestion(new Question("Самая большая пустыня?", ["Антарктическая", "Аравийская", "Гоби", "Сахара"], 3, 10));
        geographyCategory.addQuestion(new Question("Самый большой океан?", ["Атлантический", "Индийский", "Северный Ледовитый", "Тихий"], 3, 10));
        geographyCategory.addQuestion(new Question("Самая высокая точка Европы?", ["Монблан", "Дыхтау", "Казбек", "Эльбрус"], 3, 10));
        geographyCategory.addQuestion(new Question("Самый большой материк?", ["Африка", "Северная Америка", "Южная Америка", "Евразия"], 3, 10));
        categories.push(geographyCategory);

        // Категория История - 10 вопросов
        const historyCategory = new Category("История");
        historyCategory.addQuestion(new Question("В каком году началась Вторая мировая война?", ["1939", "1914", "1941", "1918"], 0, 10));
        historyCategory.addQuestion(new Question("Кто открыл Америку?", ["Колумб", "Магеллан", "Васко да Гама", "Кук"], 0, 10));
        historyCategory.addQuestion(new Question("В каком году первый полет человека в космос?", ["1961", "1957", "1965", "1969"], 0, 10));
        historyCategory.addQuestion(new Question("Кто написал 'Войну и мир'?", ["Толстой", "Достоевский", "Пушкин", "Чехов"], 0, 10));
        historyCategory.addQuestion(new Question("В каком году произошла Куликовская битва?", ["1380", "1240", "1480", "1612"], 0, 10));
        historyCategory.addQuestion(new Question("Кто был первым президентом США?", ["Вашингтон", "Джефферсон", "Линкольн", "Адамс"], 0, 10));
        historyCategory.addQuestion(new Question("В каком году основан Санкт-Петербург?", ["1703", "1712", "1721", "1682"], 0, 10));
        historyCategory.addQuestion(new Question("Кто изобрел телефон?", ["Белл", "Эдисон", "Тесла", "Маркони"], 0, 10));
        historyCategory.addQuestion(new Question("Столица Византийской империи?", ["Константинополь", "Рим", "Афины", "Александрия"], 0, 10));
        historyCategory.addQuestion(new Question("В каком году крещение Руси?", ["988", "862", "945", "980"], 0, 10));
        categories.push(historyCategory);

        this.saveAllCategories(categories);
        return categories;
    }
}

const storage = new StorageManager();