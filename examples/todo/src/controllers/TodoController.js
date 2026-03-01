import { FXML } from 'pocketfx';

export class TodoController {
    taskInput = new FXML();
    addBtn = new FXML();
    taskList = new FXML();

    tasks = [];

    async initialize() {
        this.addBtn.onclick = () => this.saveTask();
        await this.loadData();
    }

    async loadData() {
        this.tasks = await this.pb.collection('tasks').getFullList();
        this.renderList();
    }

    renderList() {
        this.taskList.replaceChildren();
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.title;
            this.taskList.appendChild(li);
        });
    }

    async saveTask() {
        const title = this.taskInput.value;
        if (!title) return;
        await this.pb.collection('tasks').create({ title });
        this.taskInput.value = '';
        await this.loadData();
    }
}