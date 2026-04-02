// Модели данных
class Question {
    constructor(text = "", options = [], correctOptionIndex = 0, points = 10) {
        this.Text = text;
        this.Options = options;
        this.CorrectOptionIndex = correctOptionIndex;
        this.Points = points;
        this.IsResolved = false;
    }

    toJSON() {
        return {
            Text: this.Text,
            Options: this.Options,
            CorrectOptionIndex: this.CorrectOptionIndex,
            Points: this.Points,
            IsResolved: this.IsResolved
        };
    }

    static fromJSON(data) {
        const q = new Question(data.Text, data.Options, data.CorrectOptionIndex, data.Points);
        q.IsResolved = data.IsResolved || false;
        return q;
    }
}

class Category {
    constructor(name = "") {
        this.Name = name;
        this.Questions = [];
    }

    isEmpty() {
        return this.Questions.length === 0;
    }

    addQuestion(question) {
        this.Questions.push(question);
    }

    getQuestion(index) {
        if (index < 0 || index >= this.Questions.length) return null;
        return this.Questions[index];
    }

    removeQuestion(index) {
        if (index >= 0 && index < this.Questions.length) {
            this.Questions.splice(index, 1);
        }
    }

    toJSON() {
        return {
            Name: this.Name,
            Questions: this.Questions.map(q => q.toJSON())
        };
    }

    static fromJSON(data) {
        const cat = new Category(data.Name);
        cat.Questions = (data.Questions || []).map(q => Question.fromJSON(q));
        return cat;
    }
}

class User {
    constructor(login, password, role = "Tested", score = 0) {
        this.Login = login;
        this.Password = password;
        this.Role = role;
        this.Score = score;
    }

    toJSON() {
        return {
            Login: this.Login,
            Password: this.Password,
            Role: this.Role,
            Score: this.Score
        };
    }

    static fromJSON(data) {
        return new User(data.Login, data.Password, data.Role, data.Score);
    }
}

class UserProgress {
    constructor(login) {
        this.Login = login;
        this.Score = 0;
        this.ResolvedQuestions = {};
    }

    markQuestionResolved(categoryName, questionIndex) {
        if (!this.ResolvedQuestions[categoryName]) {
            this.ResolvedQuestions[categoryName] = [];
        }
        if (!this.ResolvedQuestions[categoryName].includes(questionIndex)) {
            this.ResolvedQuestions[categoryName].push(questionIndex);
        }
    }

    isQuestionResolved(categoryName, questionIndex) {
        return this.ResolvedQuestions[categoryName] && 
               this.ResolvedQuestions[categoryName].includes(questionIndex);
    }

    toJSON() {
        return {
            Login: this.Login,
            Score: this.Score,
            ResolvedQuestions: this.ResolvedQuestions
        };
    }

    static fromJSON(data) {
        const progress = new UserProgress(data.Login);
        progress.Score = data.Score || 0;
        progress.ResolvedQuestions = data.ResolvedQuestions || {};
        return progress;
    }
}