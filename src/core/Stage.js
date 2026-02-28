import { PocketFX } from './Engine.js';

export class Stage {
    constructor(title = '') {
        this.title = title;
        this.controller = null;

        // build DOM structure lazily
        this.container = document.createElement('div');
        this.container.className = 'pfx-stage-overlay';

        const windowEl = document.createElement('div');
        windowEl.className = 'pfx-stage-window';
        windowEl.innerHTML = `
            <div class="pfx-stage-header">
                <span class="pfx-stage-title"></span>
                <button class="pfx-stage-close">&times;</button>
            </div>
            <div class="pfx-stage-content"></div>
        `;

        this.container.appendChild(windowEl);
        this.headerTitle = windowEl.querySelector('.pfx-stage-title');
        this.content = windowEl.querySelector('.pfx-stage-content');
        this.closeButton = windowEl.querySelector('.pfx-stage-close');

        this.headerTitle.textContent = this.title;
        this.closeButton.onclick = () => this.close();
    }

    async setScene(ControllerClass, initData = null) {
        const { root, controller } = await PocketFX.loadView(ControllerClass);
        if (initData && typeof controller.initData === 'function') controller.initData(initData);
        this.content.replaceChildren(root);
        this.controller = controller;

        if (typeof controller.initialize === 'function') await controller.initialize();
        if (typeof controller.onShow === 'function') controller.onShow();

        return controller;
    }

    show() {
        document.body.appendChild(this.container);
    }

    close() {
        if (this.controller && typeof this.controller.onHide === 'function') {
            try { this.controller.onHide(); } catch (e) { console.error(e); }
        }
        if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}
