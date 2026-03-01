import { FXML } from '/build/pocketfx.esm.js';

export class TodoController {
    taskForm = new FXML();
    taskInput = new FXML();
    addBtn = new FXML();
    taskList = new FXML();

    tasks = [];

    async initialize() {
        // prevent form submit (enter key) from causing a page reload
        if (this.taskForm) {
            this.taskForm.onsubmit = e => e.preventDefault();
        }

        this.addBtn.onclick = () => this.saveTask();
        await this.loadData();
    }

    async loadData() {
        // sample static data for demo purposes
        this.tasks = [
            { id: '1', title: 'Comprar pan', completed: false, created: new Date().toISOString(), updated: new Date().toISOString() },
            { id: '2', title: 'Estudiar JavaScript', completed: true, created: new Date().toISOString(), updated: new Date().toISOString() },
            { id: '3', title: 'Hacer ejercicio', completed: false, created: new Date().toISOString(), updated: new Date().toISOString() }
        ];
        this.renderList();
    }

    renderList() {
        this.taskList.replaceChildren();
        this.tasks.forEach(task => {
            const li = this.taskToHTML(task)
            this.taskList.appendChild(li);
        });
    }
    taskToHTML(task) {
        const article = document.createElement('article');

        const title = document.createElement('label');
        title.textContent = task.title;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'completed';
        checkbox.checked = task.completed;

        const label = document.createElement('label');
        label.textContent = 'Completed';

        article.append(title, checkbox, label);
        return article;
    }

    async saveTask() {
        const title = this.taskInput.value;
        if (!title) return;
        // simulate persistence by pushing into array
        this.tasks.push({
            id: String(this.tasks.length + 1),
            title,
            completed: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        });
        this.taskInput.value = '';
        this.renderList();
    }
}