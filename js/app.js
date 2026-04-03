// Основное приложение
class QuizApp {
    constructor() {
        this.currentUser = null;
        this.categories = [];
        this.users = [];
        this.userProgress = null;
        this.selectedCategory = null;
        this.currentQuestion = null;
        this.selectedOption = null;
        this.categoryToDelete = null;
        this.editingQuestion = null;
        this.editingCategory = null;
        
        this.init();
    }

    async init() {
        this.categories = storage.createBaseCategoriesIfNeeded();
        this.users = storage.loadAllUsers();
        
        this.setupEventListeners();
        this.setupModalCloseOnBackground();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        document.getElementById('addAdminForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAdmin();
        });

        document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        document.getElementById('addQuestionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuestion();
        });

        document.getElementById('editQuestionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.editQuestion();
        });

        document.getElementById('deleteQuestionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.deleteQuestion();
        });

        document.getElementById('editCategory').addEventListener('change', () => {
            this.loadQuestionsForEdit();
        });

        document.getElementById('deleteCategory').addEventListener('change', () => {
            this.loadQuestionsForDelete();
        });
        
        document.getElementById('resetAction').addEventListener('change', () => {
            const action = document.getElementById('resetAction').value;
            const categoryDiv = document.getElementById('resetCategorySelect');
            categoryDiv.style.display = action === 'category' ? 'block' : 'none';
            if (action === 'category') {
                this.loadCategoriesForReset();
            }
        });
        
        document.getElementById('saveAction').addEventListener('change', () => {
            const action = document.getElementById('saveAction').value;
            document.getElementById('saveCategoriesSelect').style.display = action === 'multiple' ? 'block' : 'none';
            document.getElementById('saveSingleSelect').style.display = action === 'single' ? 'block' : 'none';
        });
    }

    setupModalCloseOnBackground() {
        const modals = document.querySelectorAll('.modal');
        const protectedModals = [
            'addCategoryModal', 'addQuestionModal', 'editQuestionModal', 
            'deleteQuestionModal', 'resetProgressModal', 'resetLocalStorageModal',
            'saveCategoriesModal', 'deleteCategoryModal', 'addAdminModal'
        ];
        
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (protectedModals.includes(modal.id)) {
                    if (e.target === modal) {
                        return;
                    }
                } else {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                }
            });
        });
    }

    showRegisterScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('registerScreen').classList.add('active');
    }

    showLoginScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('registerForm').reset();
    }

    register() {
        const login = document.getElementById('regLogin').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (!login || !password) {
            this.showResult("Ошибка", "Заполните все поля!");
            return;
        }

        if (password !== confirmPassword) {
            this.showResult("Ошибка", "Пароли не совпадают!");
            return;
        }

        if (this.users.find(u => u.Login === login)) {
            this.showResult("Ошибка", "Пользователь с таким логином уже существует!");
            return;
        }

        const newUser = new User(login, password, "Tested", 0);
        this.users.push(newUser);
        storage.saveAllUsers(this.users);

        this.showResult("Успех", "Регистрация прошла успешно! Теперь вы можете войти.");
        
        setTimeout(() => {
            this.showLoginScreen();
        }, 2000);
    }

    showAddAdminModal() {
        document.getElementById('addAdminModal').style.display = 'block';
    }

    addAdmin() {
        const login = document.getElementById('adminLogin').value.trim();
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;

        if (!login || !password) {
            this.showResult("Ошибка", "Заполните все поля!");
            return;
        }

        if (password !== confirmPassword) {
            this.showResult("Ошибка", "Пароли не совпадают!");
            return;
        }

        if (this.users.find(u => u.Login === login)) {
            this.showResult("Ошибка", "Пользователь с таким логином уже существует!");
            return;
        }

        const newAdmin = new User(login, password, "Admin", 0);
        this.users.push(newAdmin);
        storage.saveAllUsers(this.users);

        this.closeModal('addAdminModal');
        document.getElementById('addAdminForm').reset();
        this.showResult("Успех", "Администратор добавлен!");
        
        storage.saveLog({
            type: 'add_admin',
            username: this.currentUser.Login,
            newAdmin: login,
            date: new Date().toISOString(),
            message: `Добавлен новый администратор "${login}"`
        });
    }

    showUsersList() {
        const container = document.getElementById('usersList');
        container.innerHTML = '';
        
        if (this.users.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет пользователей</div>';
        } else {
            this.users.forEach((user) => {
                const userProgress = storage.loadUserProgress(user.Login);
                let completedCategories = 0;
                let totalCompleted = 0;
                
                for (const category of this.categories) {
                    const resolvedCount = category.Questions.filter(q => userProgress.isQuestionResolved(category.Name, category.Questions.indexOf(q))).length;
                    if (resolvedCount === category.Questions.length && category.Questions.length > 0) {
                        completedCategories++;
                    }
                    totalCompleted += resolvedCount;
                }
                
                const card = document.createElement('div');
                card.className = 'category-card';
                card.innerHTML = `
                    <h3>${user.Login} ${user.Role === 'Admin' ? '👑' : '👤'}</h3>
                    <p>Роль: ${user.Role === 'Admin' ? 'Администратор' : 'Пользователь'}</p>
                    ${user.Role !== 'Admin'?`<p>Счет: ${userProgress.Score} баллов</p>`:''}
                    ${user.Role !== 'Admin'?`<p>Пройдено вопросов: ${totalCompleted}/${this.categories.reduce((sum, cat) => sum + cat.Questions.length, 0)}</p>`:''}
                    ${user.Role !== 'Admin'?`<p>Завершено категорий: ${completedCategories}/${this.categories.length}</p>`:''}
                    ${user.Login !== this.currentUser.Login ? `<button class="delete-category" onclick="app.deleteUser('${user.Login}')">Удалить пользователя</button>` : ''}
                `;
                container.appendChild(card);
            });
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('usersListScreen').classList.add('active');
    }

    deleteUser(login) {
        if (confirm(`Вы уверены, что хотите удалить пользователя "${login}"?`)) {
            const index = this.users.findIndex(u => u.Login === login);
            if (index !== -1) {
                this.users.splice(index, 1);
                storage.saveAllUsers(this.users);
                localStorage.removeItem(`quiz_progress_${login}`);
                
                storage.saveLog({
                    type: 'delete_user',
                    username: this.currentUser.Login,
                    deletedUser: login,
                    date: new Date().toISOString(),
                    message: `Удален пользователь "${login}"`
                });
                
                this.showResult("Успех", `Пользователь "${login}" удален`);
                this.showUsersList();
            }
        }
    }

    login() {
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value.trim();

        const user = this.users.find(u => u.Login === login && u.Password === password);
        
        if (user) {
            this.currentUser = user;
            this.userProgress = storage.loadUserProgress(login);
            this.currentUser.Score = this.userProgress.Score;
            this.syncProgressWithQuestions();
            storage.saveAllUsers(this.users);
            
            storage.saveLog({
                type: 'login',
                username: login,
                date: new Date().toISOString(),
                message: `Вход в систему`
            });
            
            this.showUserScreen();
        } else {
            this.showResult("Ошибка", "Неправильный логин или пароль!");
        }
    }

    syncProgressWithQuestions() {
        for (const category of this.categories) {
            for (let i = 0; i < category.Questions.length; i++) {
                if (this.userProgress.isQuestionResolved(category.Name, i)) {
                    category.Questions[i].IsResolved = true;
                } else {
                    category.Questions[i].IsResolved = false;
                }
            }
        }
        storage.saveAllCategories(this.categories);
    }

    showUserScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        if (this.currentUser.Role === 'Admin') {
            document.getElementById('adminScreen').classList.add('active');
            document.getElementById('adminUsername').textContent = this.currentUser.Login;
        } else {
            document.getElementById('userScreen').classList.add('active');
            document.getElementById('userUsername').textContent = this.currentUser.Login;
            document.getElementById('userScore').textContent = this.userProgress.Score;
        }
    }

    showAdminMenu() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('adminScreen').classList.add('active');
    }

    showUserMenu() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('userScreen').classList.add('active');
        document.getElementById('userUsername').textContent = this.currentUser.Login;
        document.getElementById('userScore').textContent = this.userProgress.Score;
    }

    // ==================== МЕТОДЫ ДЛЯ АДМИНА ====================
    
    showResetLocalStorage() {
        document.getElementById('resetLocalStorageModal').style.display = 'block';
        
        const confirmBtn = document.getElementById('confirmResetLocalStorageBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener('click', () => this.resetLocalStorage());
    }
    
    resetLocalStorage() {
        localStorage.clear();
        this.showResult("Успех", "localStorage полностью очищен! Страница будет перезагружена.");
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
    
    showSaveCategoriesModal() {
        const container = document.getElementById('saveCategoriesCheckboxes');
        container.innerHTML = '';
        
        this.categories.forEach((category, idx) => {
            container.innerHTML += `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" class="save-category-checkbox" value="${category.Name}">
                        <span>${category.Name} (${category.Questions.length} вопросов)</span>
                    </label>
                </div>
            `;
        });
        
        const singleSelect = document.getElementById('saveSingleCategory');
        singleSelect.innerHTML = '<option value="">Выберите категорию</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = `${category.Name} (${category.Questions.length} вопросов)`;
            singleSelect.appendChild(option);
        });
        
        document.getElementById('saveCategoriesModal').style.display = 'block';
        
        const confirmBtn = document.getElementById('confirmSaveBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener('click', () => this.saveCategories());
    }
    
    saveCategories() {
        const action = document.getElementById('saveAction').value;
        let categoriesToSave = [];
        
        if (action === 'all') {
            categoriesToSave = this.categories;
        } else if (action === 'multiple') {
            const checkboxes = document.querySelectorAll('.save-category-checkbox:checked');
            checkboxes.forEach(cb => {
                const category = this.categories.find(c => c.Name === cb.value);
                if (category) categoriesToSave.push(category);
            });
        } else if (action === 'single') {
            const categoryName = document.getElementById('saveSingleCategory').value;
            if (categoryName) {
                const category = this.categories.find(c => c.Name === categoryName);
                if (category) categoriesToSave.push(category);
            }
        }
        
        if (categoriesToSave.length === 0) {
            this.showResult("Ошибка", "Не выбрано ни одной категории для сохранения!");
            return;
        }
        
        const exportData = {
            exportDate: new Date().toISOString(),
            categories: categoriesToSave.map(c => c.toJSON())
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const filename = categoriesToSave.length === 1 
            ? `${categoriesToSave[0].Name}.json`
            : `categories_${new Date().toISOString().slice(0,19)}.json`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.closeModal('saveCategoriesModal');
        this.showResult("Успех", `Сохранено ${categoriesToSave.length} категорий в файл "${filename}"`);
        
        storage.saveLog({
            type: 'export_categories',
            username: this.currentUser.Login,
            count: categoriesToSave.length,
            date: new Date().toISOString(),
            message: `Экспортировано ${categoriesToSave.length} категорий`
        });
    }
    
    loadCategoriesFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.multiple = false;
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    let loadedCategories = [];
                    
                    if (data.categories && Array.isArray(data.categories)) {
                        loadedCategories = data.categories.map(c => Category.fromJSON(c));
                    } else if (data.Name && data.Questions) {
                        loadedCategories = [Category.fromJSON(data)];
                    } else if (Array.isArray(data)) {
                        loadedCategories = data.map(c => Category.fromJSON(c));
                    } else {
                        throw new Error("Неверный формат файла");
                    }
                    
                    if (loadedCategories.length === 0) {
                        this.showResult("Ошибка", "Не найдено категорий в файле!");
                        return;
                    }
                    
                    for (const newCat of loadedCategories) {
                        const existingIndex = this.categories.findIndex(c => c.Name === newCat.Name);
                        if (existingIndex !== -1) {
                            if (confirm(`Категория "${newCat.Name}" уже существует. Заменить её?`)) {
                                this.categories[existingIndex] = newCat;
                            }
                        } else {
                            this.categories.push(newCat);
                        }
                    }
                    
                    storage.saveAllCategories(this.categories);
                    this.showResult("Успех", `Загружено ${loadedCategories.length} категорий из файла "${file.name}"`);
                    
                    storage.saveLog({
                        type: 'import_categories',
                        username: this.currentUser.Login,
                        count: loadedCategories.length,
                        date: new Date().toISOString(),
                        message: `Импортировано ${loadedCategories.length} категорий из файла`
                    });
                    
                } catch (error) {
                    this.showResult("Ошибка", "Не удалось загрузить файл. Неверный формат.");
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    showCategoriesList() {
        const container = document.getElementById('adminCategoriesList');
        container.innerHTML = '';
        
        if (this.categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет доступных категорий</div>';
        } else {
            this.categories.forEach((category) => {
                let usersCompleted = 0;
                for (const user of this.users) {
                    if (user.Role !== 'Admin') {
                        const userProgress = storage.loadUserProgress(user.Login);
                        const allResolved = category.Questions.every((q, idx) => userProgress.isQuestionResolved(category.Name, idx));
                        if (allResolved && category.Questions.length > 0) {
                            usersCompleted++;
                        }
                    }
                }
                
                const card = document.createElement('div');
                card.className = 'category-card';
                card.innerHTML = `
                    <h3>${category.Name}</h3>
                    <p>Вопросов: ${category.Questions.length}</p>
                    <p>Пользователей прошло: ${usersCompleted}</p>
                    <button class="delete-category" onclick="app.confirmDeleteCategory('${category.Name}')">Удалить категорию</button>
                `;
                container.appendChild(card);
            });
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('adminCategoriesScreen').classList.add('active');
    }

    confirmDeleteCategory(categoryName) {
        this.categoryToDelete = categoryName;
        const message = document.getElementById('deleteCategoryMessage');
        message.textContent = `Вы уверены, что хотите удалить категорию "${categoryName}" и все вопросы в ней?`;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener('click', () => this.deleteCategory());
        
        document.getElementById('deleteCategoryModal').style.display = 'block';
    }

    deleteCategory() {
        const index = this.categories.findIndex(c => c.Name === this.categoryToDelete);
        if (index !== -1) {
            this.categories.splice(index, 1);
            storage.saveAllCategories(this.categories);
            
            storage.saveLog({
                type: 'delete_category',
                username: this.currentUser.Login,
                category: this.categoryToDelete,
                date: new Date().toISOString(),
                message: `Удалена категория "${this.categoryToDelete}"`
            });
            
            this.showResult("Успех", `Категория "${this.categoryToDelete}" удалена`);
            this.closeModal('deleteCategoryModal');
            this.showCategoriesList();
        }
        this.categoryToDelete = null;
    }

    showCategories() {
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';
        
        const availableCategories = this.categories.filter(cat => 
            cat.Questions.some(q => !q.IsResolved)
        );
        
        if (availableCategories.length === 0) {
            categoriesList.innerHTML = '<div class="empty-state">Все вопросы пройдены! Поздравляем!</div>';
        } else {
            availableCategories.forEach((category) => {
                const unresolvedCount = category.Questions.filter(q => !q.IsResolved).length;
                const card = document.createElement('div');
                card.className = 'category-card';
                card.onclick = () => this.showQuestions(category.Name);
                card.innerHTML = `
                    <h3>${category.Name}</h3>
                    <p>Доступно вопросов: ${unresolvedCount}</p>
                    <p>Всего вопросов: ${category.Questions.length}</p>
                `;
                categoriesList.appendChild(card);
            });
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('categoriesScreen').classList.add('active');
    }

    showQuestions(categoryName) {
        this.selectedCategory = this.categories.find(c => c.Name === categoryName);
        
        if (!this.selectedCategory) return;
        
        const questionsList = document.getElementById('questionsList');
        const categoryTitle = document.getElementById('categoryTitle');
        categoryTitle.textContent = this.selectedCategory.Name;
        questionsList.innerHTML = '';
        
        const availableQuestions = this.selectedCategory.Questions.filter((q) => !q.IsResolved);
        
        if (availableQuestions.length === 0) {
            questionsList.innerHTML = '<div class="empty-state">В этой категории больше нет доступных вопросов!</div>';
        } else {
            availableQuestions.forEach((question) => {
                const originalIndex = this.selectedCategory.Questions.findIndex(q => q === question);
                const card = document.createElement('div');
                card.className = 'question-card';
                card.onclick = () => this.askQuestion(originalIndex);
                card.innerHTML = `
                    <div class="question-info">
                        <strong>${question.Text}</strong>
                    </div>
                    <div class="question-points">${question.Points} баллов</div>
                `;
                questionsList.appendChild(card);
            });
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('questionsScreen').classList.add('active');
    }

    askQuestion(questionIndex) {
        this.currentQuestion = this.selectedCategory.Questions[questionIndex];
        
        const modal = document.getElementById('questionModal');
        const modalText = document.getElementById('modalQuestionText');
        const modalOptions = document.getElementById('modalOptions');
        
        modalText.textContent = this.currentQuestion.Text;
        modalOptions.innerHTML = '';
        
        this.currentQuestion.Options.forEach((option, idx) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.textContent = `${idx + 1}. ${option}`;
            optionDiv.onclick = () => {
                document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
                this.selectedOption = idx;
            };
            modalOptions.appendChild(optionDiv);
        });
        
        modal.style.display = 'block';
    }

    submitAnswer() {
        if (this.selectedOption === null) {
            this.showResult("Ошибка", "Пожалуйста, выберите вариант ответа!");
            return;
        }
        
        const isCorrect = this.selectedOption === this.currentQuestion.CorrectOptionIndex;
        const questionIndex = this.selectedCategory.Questions.indexOf(this.currentQuestion);
        
        if (isCorrect) {
            this.userProgress.Score += this.currentQuestion.Points;
            this.currentUser.Score = this.userProgress.Score;
            this.userProgress.markQuestionResolved(this.selectedCategory.Name, questionIndex);
            this.currentQuestion.IsResolved = true;
            
            storage.saveAllCategories(this.categories);
            storage.saveUserProgress(this.userProgress);
            
            const userIndex = this.users.findIndex(u => u.Login === this.currentUser.Login);
            if (userIndex !== -1) {
                this.users[userIndex].Score = this.userProgress.Score;
                storage.saveAllUsers(this.users);
            }
            
            storage.saveLog({
                type: 'answer',
                username: this.currentUser.Login,
                category: this.selectedCategory.Name,
                question: this.currentQuestion.Text,
                correct: true,
                points: this.currentQuestion.Points,
                totalScore: this.userProgress.Score,
                date: new Date().toISOString(),
                message: `Правильный ответ на вопрос "${this.currentQuestion.Text.substring(0, 50)}..." в категории "${this.selectedCategory.Name}" +${this.currentQuestion.Points} баллов`
            });
            
            this.showResult("Правильно!", `+${this.currentQuestion.Points} баллов!\n\nВаш счет: ${this.userProgress.Score}`);
            
            this.closeModal('questionModal');
            this.selectedOption = null;
            this.updateScoreDisplay();
            this.showQuestions(this.selectedCategory.Name);
            
        } else {
            storage.saveLog({
                type: 'answer',
                username: this.currentUser.Login,
                category: this.selectedCategory.Name,
                question: this.currentQuestion.Text,
                correct: false,
                correctAnswer: this.currentQuestion.Options[this.currentQuestion.CorrectOptionIndex],
                totalScore: this.userProgress.Score,
                date: new Date().toISOString(),
                message: `Неправильный ответ на вопрос "${this.currentQuestion.Text.substring(0, 50)}..." в категории "${this.selectedCategory.Name}"`
            });
            
            this.showResult("Неправильно!", "К сожалению, ответ неверный.\nПопробуйте следующий вопрос!");
            
            this.closeModal('questionModal');
            this.selectedOption = null;
            this.updateScoreDisplay();
            this.showQuestions(this.selectedCategory.Name);
        }
    }

    updateScoreDisplay() {
        document.getElementById('userScore').textContent = this.userProgress.Score;
    }

    showMyResult() {
        const totalQuestions = this.categories.reduce((sum, cat) => sum + cat.Questions.length, 0);
        const resolvedQuestions = this.categories.reduce((sum, cat) => 
            sum + cat.Questions.filter(q => q.IsResolved).length, 0);
        
        let details = '';
        for (const category of this.categories) {
            const resolved = category.Questions.filter(q => q.IsResolved).length;
            const percent = category.Questions.length > 0 ? Math.round(resolved / category.Questions.length * 100) : 0;
            details += `\n▪ ${category.Name}: ${resolved}/${category.Questions.length} (${percent}%)`;
        }
        
        const message = `Набрано баллов: ${this.userProgress.Score}\n` +
                       `Пройдено вопросов: ${resolvedQuestions} из ${totalQuestions}\n` +
                       `Процент выполнения: ${Math.round(resolvedQuestions/totalQuestions*100)}%\n\n` +
                       `Детали по категориям:\n${details}`;
        
        this.showResult("Ваш результат", message);
    }

    showLogs() {
        const logs = storage.loadAllLogs();
        const container = document.getElementById('logsList');
        container.innerHTML = '';
        
        if (logs.length === 0) {
            container.innerHTML = '<div class="empty-state">Логи отсутствуют</div>';
        } else {
            logs.forEach(log => {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                
                let statusHtml = '';
                if (log.type === 'answer') {
                    statusHtml = `<div class="log-detail">
                        Категория: ${log.category}<br>
                        Вопрос: ${log.question}<br>
                        Результат: ${log.correct ? '✓ Правильно' : '✗ Неправильно'} ${log.correct ? `(+${log.points} баллов)` : ''}<br>
                        ${log.correct ? `Общий счет: ${log.totalScore}` : ''}
                    </div>`;
                } else if (log.type === 'reset') {
                    statusHtml = `<div class="log-detail">Действие: ${log.message}</div>`;
                } else if (log.type === 'delete_category') {
                    statusHtml = `<div class="log-detail">Действие: ${log.message}</div>`;
                } else if (log.type === 'delete_user') {
                    statusHtml = `<div class="log-detail">Действие: ${log.message}</div>`;
                } else if (log.type === 'add_admin') {
                    statusHtml = `<div class="log-detail">Действие: ${log.message}</div>`;
                } else if (log.type === 'login') {
                    statusHtml = `<div class="log-detail">Действие: ${log.message}</div>`;
                } else if (log.type === 'logout') {
                    statusHtml = `<div class="log-detail">${log.message}</div>`;
                } else if (log.type === 'export_categories') {
                    statusHtml = `<div class="log-detail">Экспортировано категорий: ${log.count}</div>`;
                } else if (log.type === 'import_categories') {
                    statusHtml = `<div class="log-detail">Импортировано категорий: ${log.count}</div>`;
                }
                
                logEntry.innerHTML = `
                    <div class="log-date">${new Date(log.date).toLocaleString()}</div>
                    <div class="log-user">Пользователь: <strong>${log.username}</strong></div>
                    <div class="log-score">${log.type === 'answer' ? (log.correct ? 'Правильный ответ' : 'Неправильный ответ') : log.message}</div>
                    ${statusHtml}
                `;
                container.appendChild(logEntry);
            });
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('logsScreen').classList.add('active');
    }

    clearLogs() {
        if (confirm("Вы уверены, что хотите очистить все логи?")) {
            storage.clearLogs();
            this.showResult("Успех", "Логи очищены");
            this.showLogs();
        }
    }

    showResetUserProgress() {
        const select = document.getElementById('resetUserSelect');
        select.innerHTML = '<option value="">Выберите пользователя</option>';
        
        const regularUsers = this.users.filter(u => u.Role !== 'Admin');
        regularUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.Login;
            option.textContent = `${user.Login} (счет: ${user.Score})`;
            select.appendChild(option);
        });
        
        document.getElementById('resetProgressModal').style.display = 'block';
        
        const confirmBtn = document.getElementById('confirmResetBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener('click', () => this.resetUserProgress());
    }

    loadCategoriesForReset() {
        const select = document.getElementById('resetCategoryName');
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = category.Name;
            select.appendChild(option);
        });
    }

    resetUserProgress() {
        const username = document.getElementById('resetUserSelect').value;
        const action = document.getElementById('resetAction').value;
        
        if (!username) {
            this.showResult("Ошибка", "Выберите пользователя!");
            return;
        }
        
        let categoryName = null;
        if (action === 'category') {
            categoryName = document.getElementById('resetCategoryName').value;
            if (!categoryName) {
                this.showResult("Ошибка", "Выберите категорию!");
                return;
            }
        }
        
        const newProgress = storage.resetUserProgress(username, categoryName);
        
        if (this.currentUser.Login === username) {
            this.userProgress = newProgress;
            this.currentUser.Score = newProgress.Score;
            this.syncProgressWithQuestions();
            this.updateScoreDisplay();
        }
        
        const userIndex = this.users.findIndex(u => u.Login === username);
        if (userIndex !== -1) {
            this.users[userIndex].Score = newProgress.Score;
            storage.saveAllUsers(this.users);
        }
        
        this.showResult("Успех", categoryName ? 
            `Прогресс по категории "${categoryName}" для пользователя ${username} сброшен` : 
            `Весь прогресс для пользователя ${username} сброшен`);
        
        this.closeModal('resetProgressModal');
    }

    showAddCategoryModal() {
        document.getElementById('addCategoryModal').style.display = 'block';
    }

    generateFirstOptionFields() {
        const count = parseInt(document.getElementById('firstOptionsCount').value);
        const container = document.getElementById('firstOptionsContainer');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            container.innerHTML += `
                <div class="form-group">
                    <label>Вариант ${i + 1}:</label>
                    <input type="text" class="first-option-input" data-index="${i}" required>
                </div>
            `;
        }
        
        container.innerHTML += `
            <div class="form-group">
                <label>Номер правильного ответа (1-${count}):</label>
                <input type="number" id="firstCorrectOption" min="1" max="${count}" required>
            </div>
        `;
    }

    addCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const questionText = document.getElementById('firstQuestionText').value.trim();
        const points = parseInt(document.getElementById('firstQuestionPoints').value);
        
        if (!name || !questionText) {
            this.showResult("Ошибка", "Введите название категории и текст вопроса!");
            return;
        }
        
        if (this.categories.find(c => c.Name === name)) {
            this.showResult("Ошибка", "Категория с таким именем уже существует!");
            return;
        }
        
        const options = [];
        const optionInputs = document.querySelectorAll('.first-option-input');
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                options.push(input.value.trim());
            }
        });
        
        const correctOption = parseInt(document.getElementById('firstCorrectOption').value) - 1;
        
        if (options.length < 2) {
            this.showResult("Ошибка", "Добавьте хотя бы 2 варианта ответа!");
            return;
        }
        
        if (correctOption < 0 || correctOption >= options.length) {
            this.showResult("Ошибка", "Неверный номер правильного ответа!");
            return;
        }
        
        const newCategory = new Category(name);
        const firstQuestion = new Question(questionText, options, correctOption, points);
        newCategory.addQuestion(firstQuestion);
        this.categories.push(newCategory);
        
        storage.saveAllCategories(this.categories);
        
        storage.saveLog({
            type: 'add_category',
            username: this.currentUser.Login,
            category: name,
            date: new Date().toISOString(),
            message: `Добавлена категория "${name}" с первым вопросом`
        });
        
        this.closeModal('addCategoryModal');
        document.getElementById('addCategoryForm').reset();
        document.getElementById('firstOptionsContainer').innerHTML = '';
        this.showResult("Успех", "Категория с первым вопросом добавлена!");
        
        this.resetCategorySelects();
    }

    resetCategorySelects() {
        const selects = ['questionCategory', 'editCategory', 'deleteCategory', 'resetCategoryName'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && select.options.length > 0) {
                select.selectedIndex = 0;
            }
        });
    }

    showAddQuestionModal() {
        const select = document.getElementById('questionCategory');
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = category.Name;
            select.appendChild(option);
        });
        
        document.getElementById('addQuestionModal').style.display = 'block';
    }

    generateOptionFields() {
        const count = parseInt(document.getElementById('optionsCount').value);
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            container.innerHTML += `
                <div class="form-group">
                    <label>Вариант ${i + 1}:</label>
                    <input type="text" class="option-input" data-index="${i}" required>
                </div>
            `;
        }
        
        container.innerHTML += `
            <div class="form-group">
                <label>Номер правильного ответа (1-${count}):</label>
                <input type="number" id="correctOption" min="1" max="${count}" required>
            </div>
        `;
    }

    addQuestion() {
        const categoryName = document.getElementById('questionCategory').value;
        const text = document.getElementById('questionText').value.trim();
        const points = parseInt(document.getElementById('questionPoints').value);
        
        if (!categoryName || !text) {
            this.showResult("Ошибка", "Заполните все поля!");
            return;
        }
        
        const category = this.categories.find(c => c.Name === categoryName);
        if (!category) {
            this.showResult("Ошибка", "Категория не найдена!");
            return;
        }
        
        const options = [];
        const optionInputs = document.querySelectorAll('.option-input');
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                options.push(input.value.trim());
            }
        });
        
        const correctOption = parseInt(document.getElementById('correctOption').value) - 1;
        
        if (correctOption < 0 || correctOption >= options.length) {
            this.showResult("Ошибка", "Неверный номер правильного ответа!");
            return;
        }
        
        const newQuestion = new Question(text, options, correctOption, points);
        category.addQuestion(newQuestion);
        
        storage.saveAllCategories(this.categories);
        
        storage.saveLog({
            type: 'add_question',
            username: this.currentUser.Login,
            category: categoryName,
            question: text,
            date: new Date().toISOString(),
            message: `Добавлен вопрос в категорию "${categoryName}"`
        });
        
        this.closeModal('addQuestionModal');
        document.getElementById('addQuestionForm').reset();
        document.getElementById('optionsContainer').innerHTML = '';
        this.showResult("Успех", "Вопрос добавлен!");
        
        const select = document.getElementById('questionCategory');
        if (select) select.selectedIndex = 0;
    }

    showEditQuestionModal() {
        const select = document.getElementById('editCategory');
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = category.Name;
            select.appendChild(option);
        });
        
        document.getElementById('editQuestionModal').style.display = 'block';
    }

    loadQuestionsForEdit() {
        const categoryName = document.getElementById('editCategory').value;
        const questionSelect = document.getElementById('editQuestion');
        
        if (!categoryName) {
            questionSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';
            return;
        }
        
        const category = this.categories.find(c => c.Name === categoryName);
        questionSelect.innerHTML = '<option value="">Выберите вопрос</option>';
        
        category.Questions.forEach((question, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = `${idx + 1}. ${question.Text.substring(0, 60)}${question.Text.length > 60 ? '...' : ''}`;
            questionSelect.appendChild(option);
        });
        
        questionSelect.onchange = () => {
            const index = parseInt(questionSelect.value);
            if (!isNaN(index)) {
                const question = category.Questions[index];
                this.editingQuestion = question;
                this.editingCategory = category;
                document.getElementById('editText').value = question.Text;
                document.getElementById('editPoints').value = question.Points;
                document.getElementById('editOptionsContainer').innerHTML = '';
            }
        };
    }

    showEditOptions() {
        if (!this.editingQuestion) {
            this.showResult("Ошибка", "Сначала выберите вопрос!");
            return;
        }
        
        const container = document.getElementById('editOptionsContainer');
        container.innerHTML = '<h4 style="margin-bottom: 15px; font-size: 18px;">Редактирование вариантов ответов:</h4>';
        
        this.editingQuestion.Options.forEach((option, idx) => {
            container.innerHTML += `
                <div class="edit-option-item">
                    <input type="text" class="edit-option-text" data-index="${idx}" value="${this.escapeHtml(option)}">
                    <button type="button" class="remove-option" onclick="app.removeEditOption(${idx})">Удалить</button>
                </div>
            `;
        });
        
        container.innerHTML += `
            <button type="button" class="add-option-btn" onclick="app.addEditOption()">+ Добавить вариант</button>
            <div class="form-group" style="margin-top: 20px;">
                <label>Номер правильного ответа (1-based):</label>
                <input type="number" id="editCorrectOptionNew" min="1" max="${this.editingQuestion.Options.length}" value="${this.editingQuestion.CorrectOptionIndex + 1}">
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addEditOption() {
        this.editingQuestion.Options.push("");
        this.showEditOptions();
    }

    removeEditOption(index) {
        this.editingQuestion.Options.splice(index, 1);
        if (this.editingQuestion.CorrectOptionIndex >= this.editingQuestion.Options.length) {
            this.editingQuestion.CorrectOptionIndex = this.editingQuestion.Options.length - 1;
        }
        this.showEditOptions();
    }

    editQuestion() {
        const newText = document.getElementById('editText').value.trim();
        const newPoints = parseInt(document.getElementById('editPoints').value);
        
        const optionInputs = document.querySelectorAll('.edit-option-text');
        const newOptions = [];
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                newOptions.push(input.value.trim());
            }
        });
        
        const newCorrectOption = parseInt(document.getElementById('editCorrectOptionNew')?.value) - 1;
        
        if (newText) this.editingQuestion.Text = newText;
        if (!isNaN(newPoints)) this.editingQuestion.Points = newPoints;
        if (newOptions.length >= 2) {
            this.editingQuestion.Options = newOptions;
            if (!isNaN(newCorrectOption) && newCorrectOption >= 0 && newCorrectOption < newOptions.length) {
                this.editingQuestion.CorrectOptionIndex = newCorrectOption;
            }
        }
        
        storage.saveAllCategories(this.categories);
        
        storage.saveLog({
            type: 'edit_question',
            username: this.currentUser.Login,
            category: this.editingCategory.Name,
            question: this.editingQuestion.Text,
            date: new Date().toISOString(),
            message: `Отредактирован вопрос в категории "${this.editingCategory.Name}"`
        });
        
        this.closeModal('editQuestionModal');
        this.showResult("Успех", "Вопрос отредактирован!");
        this.editingQuestion = null;
        this.editingCategory = null;
        
        const select = document.getElementById('editCategory');
        if (select) select.selectedIndex = 0;
        const questionSelect = document.getElementById('editQuestion');
        if (questionSelect) questionSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';
        document.getElementById('editText').value = '';
        document.getElementById('editPoints').value = '';
        document.getElementById('editOptionsContainer').innerHTML = '';
    }

    showDeleteQuestionModal() {
        const select = document.getElementById('deleteCategory');
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = category.Name;
            select.appendChild(option);
        });
        
        document.getElementById('deleteQuestionModal').style.display = 'block';
    }

    loadQuestionsForDelete() {
        const categoryName = document.getElementById('deleteCategory').value;
        const questionSelect = document.getElementById('deleteQuestion');
        
        if (!categoryName) {
            questionSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';
            return;
        }
        
        const category = this.categories.find(c => c.Name === categoryName);
        questionSelect.innerHTML = '<option value="">Выберите вопрос</option>';
        
        category.Questions.forEach((question, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = `${idx + 1}. ${question.Text.substring(0, 60)}${question.Text.length > 60 ? '...' : ''}`;
            questionSelect.appendChild(option);
        });
    }

    deleteQuestion() {
        const categoryName = document.getElementById('deleteCategory').value;
        const questionIndex = parseInt(document.getElementById('deleteQuestion').value);
        
        if (!categoryName || isNaN(questionIndex)) {
            this.showResult("Ошибка", "Выберите категорию и вопрос!");
            return;
        }
        
        const category = this.categories.find(c => c.Name === categoryName);
        const deletedQuestion = category.Questions[questionIndex].Text;
        category.removeQuestion(questionIndex);
        
        storage.saveAllCategories(this.categories);
        
        storage.saveLog({
            type: 'delete_question',
            username: this.currentUser.Login,
            category: categoryName,
            question: deletedQuestion,
            date: new Date().toISOString(),
            message: `Удален вопрос из категории "${categoryName}"`
        });
        
        this.closeModal('deleteQuestionModal');
        this.showResult("Успех", "Вопрос удален!");
        
        const select = document.getElementById('deleteCategory');
        if (select) select.selectedIndex = 0;
        const questionSelect = document.getElementById('deleteQuestion');
        if (questionSelect) questionSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';
    }

    logout() {
        if (this.currentUser && this.currentUser.Role !== 'Admin') {
            const totalQuestions = this.categories.reduce((sum, cat) => sum + cat.Questions.length, 0);
            const resolvedQuestions = this.categories.reduce((sum, cat) => 
                sum + cat.Questions.filter(q => q.IsResolved).length, 0);
            
            storage.saveLog({
                type: 'logout',
                username: this.currentUser.Login,
                score: this.userProgress.Score,
                resolvedQuestions: resolvedQuestions,
                totalQuestions: totalQuestions,
                date: new Date().toISOString(),
                message: `Завершение сессии. Итоговый счет: ${this.userProgress.Score}, пройдено вопросов: ${resolvedQuestions}/${totalQuestions}`
            });
        }
        
        storage.saveAllCategories(this.categories);
        storage.saveUserProgress(this.userProgress);
        
        const userIndex = this.users.findIndex(u => u.Login === this.currentUser.Login);
        if (userIndex !== -1) {
            this.users[userIndex].Score = this.userProgress.Score;
            storage.saveAllUsers(this.users);
        }
        
        this.currentUser = null;
        this.userProgress = null;
        this.selectedCategory = null;
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('loginForm').reset();
    }

    showResult(title, message) {
        const modal = document.getElementById('resultModal');
        document.getElementById('resultTitle').textContent = title;
        document.getElementById('resultMessage').textContent = message;
        modal.style.display = 'block';
        
        if (title === "Правильно!" || title === "Неправильно!") {
            setTimeout(() => {
                this.closeModal('resultModal');
            }, 2000);
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

const app = new QuizApp();