# Contexto del Proyecto: PocketFX Framework

## 1. Filosofía Core
Estás asistiendo en el desarrollo de una aplicación web utilizando **PocketFX**, un framework propietario y opinado basado en Vanilla JS y fuertemente inspirado en la arquitectura de **JavaFX / FXML**.
- **No es React, Vue ni Svelte.** No hay Virtual DOM ni SSR.
- Es una Single Page Application (SPA) estricta separada en Modelo-Vista-Controlador (MVC).
- **Backend/Estado:** Utiliza exclusivamente **PocketBase** para la base de datos, autenticación y estado global.

> 📝 **Nota:** Asegúrate de enlazar `src/core/pocketfx.css` desde tu HTML principal (por ejemplo `<link rel="stylesheet" href="/src/core/pocketfx.css">`) para que los estilos de modales y otros componentes funcionen correctamente.

## 2. Arquitectura y Reglas Estrictas (¡IMPORTANTE!)
Al escribir código para este proyecto, DEBES obedecer las siguientes reglas:

1. **Vistas (HTML):** Las vistas son archivos `.html` puros. No contienen lógica. Los elementos con los que el controlador debe interactuar deben tener un atributo `id` único.
2. **Controladores (JS):** Son clases ES6. El nombre de la clase debe terminar en `Controller` y el archivo HTML debe llamarse igual sin el sufijo (ej. `LoginController` -> `Login.html`).
3. **Inyección de Dependencias (CERO DOM Manual):**
   - **NUNCA** uses `document.getElementById` ni `querySelector` en los controladores.
   - Para vincular un elemento del HTML al JS, declara una propiedad en la clase instanciando `new FXML('idDelElemento')`. Si no pasas parámetro, el motor inferirá que el ID del HTML es exactamente el nombre de la variable.
   - El framework sobrescribirá estas propiedades con los Nodos del DOM reales antes de llamar a `initialize()`. Si no se encuentra un elemento durante la inyección se emitirá un `console.warn` para ayudarte a detectar errores de `id`.
   - Además de `this.pb`, tienes disponible un pequeño [contenedor de servicios](#) en `this.services` (registrar con `PocketFX.registerService`) para desacoplar dependencias.
   - Las vistas se almacenan en caché la primera vez que se cargan; los cambios posteriores al HTML en disco no se reflejarán hasta que se borre el caché o recargues la página..
4. **Ciclo de Vida:** Toda la lógica de arranque de una vista DEBE ir en el método asíncrono `async initialize()`.
5. **Seguridad (Prevención XSS):** - **NUNCA** uses `.innerHTML` para inyectar datos provenientes de PocketBase o del usuario. 
   - Usa siempre `.textContent` para asignar valores de texto a la interfaz.
6. **Instancia Global:** La instancia de PocketBase siempre estará disponible dentro del controlador como `this.pb`. La referencia a la raíz de la vista actual es `this.root`.

## 3. Navegación (Stages y Scenes)
- **SceneManager:** Se usa para inyectar una escena dentro de un contenedor existente (como un panel principal).
  `SceneManager.setScene(this.mainRegion, DashboardController, initData);`
  - El gestor recuerda qué controlador estaba en el contenedor y llama a `onHide()` antes de reemplazarlo y a `onShow()` después de cargar la nueva escena.
  - Se permiten vistas con múltiples nodos raíz; no necesitas envolverlo todo en un `div` único.
- **Stage:** Se usa para abrir ventanas/modales independientes.
  `const modal = new Stage("Título"); modal.setScene(FormController); modal.show();`
  - Un `Stage` genera un overlay simple con barra de título y soporte para `onShow`/`onHide`.
  - Cerrarlo dispara `onHide()` en el controlador y elimina el DOM.

## 4. Cheat Sheet / Ejemplo de Referencia

**Vista (views/Todo.html)**
```html
<div class="container">
    <input type="text" id="taskInput" placeholder="Nueva tarea">
    <button id="addBtn">Guardar</button>
    <ul id="taskList"></ul>
</div>
```

**Controlador (controllers/TodoController.js)**
```JavaScript

import { FXML } from '../core/FXML.js';

export class TodoController {
    // Inyección de elementos del DOM
    taskInput = new FXML(); 
    addBtn = new FXML();
    taskList = new FXML();

    // Variables internas
    tasks = [];

    // Método de arranque
    async initialize() {
        this.addBtn.onclick = () => this.saveTask();
        await this.loadData();
    }

    async loadData() {
        this.tasks = await this.pb.collection('tasks').getFullList();
        this.renderList();
    }

    renderList() {
        this.taskList.replaceChildren(); // Limpiar lista
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.title; // SIEMPRE textContent, nunca innerHTML
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
```
## 5. Instrucción Final

Cuando se te pida crear una nueva funcionalidad, devuelve SIEMPRE el código separado claramente en:

- El archivo HTML de la vista.
- El archivo JS del controlador respetando la clase FXML.