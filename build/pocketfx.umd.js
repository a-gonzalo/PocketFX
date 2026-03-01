(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.PocketFX = {}));
})(this, (function (exports) { 'use strict';

    class FXML {
        constructor(id = null) { this.id = id; }
    }

    // the global PocketBase client is not bundled; applications should
    // register their own instance via `PocketFX.registerService('pb', pb)`

    class PocketFX {
        // cache for view HTML strings to avoid re-fetching
        static #viewCache = new Map();
        
        // simple service registry / DI container
        static services = new Map();

        /**
         * register a singleton service by name. Controllers can access it via
         * `this.services.get(name)` after a view is loaded.
         */
        static registerService(name, instance) {
            this.services.set(name, instance);
        }

        static getService(name) {
            return this.services.get(name);
        }

        /**
         * Load an HTML view and instantiate the associated controller. The method
         * will cache the raw HTML so subsequent loads are faster and it performs
         * a shallow DOM clone for each invocation.
         */
        /**
         * Base path used when fetching views. Default is a relative path so that
         * applications hosted in a subfolder will still resolve correctly. You can
         * override it before calling `SceneManager` if your layout differs.
         *
         * e.g. `PocketFX.viewPath = '/src/views/';`
         */
        static viewPath = 'src/views/';

        static async loadView(ControllerClass) {
            const viewName = ControllerClass.name.replace('Controller', '');
            let html;

            if (this.#viewCache.has(viewName)) {
                html = this.#viewCache.get(viewName);
            } else {
                const response = await fetch(`${this.viewPath}${viewName}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load view ${viewName}: ${response.status}`);
                }
                html = await response.text();
                this.#viewCache.set(viewName, html);
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html.trim(), 'text/html');

            // allow multiple root nodes by using a DocumentFragment
            const rootNode = document.createDocumentFragment();
            Array.from(doc.body.childNodes).forEach(node => rootNode.appendChild(node));

            const controller = new ControllerClass();
            controller.pb = pb;                  // legacy global reference
            controller.root = rootNode;
            controller.services = this.services; // lightweight DI container

            // inject DOM elements for each FXML property
            for (const key of Object.keys(controller)) {
                if (controller[key] instanceof FXML) {
                    const elementId = controller[key].id || key;
                    // querySelector works on DocumentFragment because it implements
                    // ParentNode
                    const element = rootNode.querySelector
                        ? rootNode.querySelector(`#${elementId}`)
                        : null;

                    if (element) {
                        controller[key] = element;
                    } else {
                        console.warn(
                            `FXML injection failed: element with id '${elementId}' not found in view '${viewName}'`
                        );
                    }
                }
            }

            return { root: rootNode, controller };
        }

        /**
         * Inflate a fragment from the `fragments` folder. This method does not keep
         * a cache because fragments are usually small and their contents depend on
         * runtime data.
         */
        static async inflate(templateName, data, setupFn) {
            const response = await fetch(`/src/views/fragments/${templateName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load fragment ${templateName}: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html.trim(), 'text/html');
            const node = doc.body.firstElementChild;

            const fxml = {};
            node.querySelectorAll('[id]').forEach(el => fxml[el.id] = el);

            if (setupFn) setupFn(node, fxml, data);

            return node;
        }
    }

    // if a global `pb` variable is present (legacy), register it automatically.
    // otherwise consumers should register their PocketBase instance manually.
    if (typeof pb !== 'undefined') {
        PocketFX.registerService('pb', pb);
    }

    class SceneManager {
        // keep track of the controller currently attached to each container so we can
        // invoke lifecycle hooks when scenes change.
        static #activeControllers = new WeakMap();

        static async setScene(container, ControllerClass, initData = null) {
            // hide previous scene if any
            const previous = this.#activeControllers.get(container);
            if (previous && typeof previous.onHide === 'function') {
                try { previous.onHide(); } catch (e) { console.error(e); }
            }

            const { root, controller } = await PocketFX.loadView(ControllerClass);
            if (initData && typeof controller.initData === 'function') controller.initData(initData);

            container.replaceChildren(root);
            this.#activeControllers.set(container, controller);

            if (typeof controller.initialize === 'function') await controller.initialize();
            if (typeof controller.onShow === 'function') controller.onShow();

            return controller;
        }
    }

    class Stage {
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

    class EventBus {
        static #events = {};

        static subscribe(event, callback) {
            if (!this.#events[event]) this.#events[event] = [];
            this.#events[event].push(callback);

            return () => {
                this.#events[event] = this.#events[event].filter(cb => cb !== callback);
            };
        }

        static publish(event, data) {
            if (!this.#events[event]) return;
            this.#events[event].forEach(callback => callback(data));
        }
    }

    class Security {
        static sanitizeHTML(str) {
            if (!str) return '';
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        }

        static safeSetText(element, text) {
            if (element) {
                element.textContent = text;
            }
        }

        static safeSetAttribute(element, name, value) {
            if (element && typeof value !== 'undefined' && value !== null) {
                // attributes are always serialized as strings; sanitize via text
                element.setAttribute(name, String(value));
            }
        }
    }

    exports.EventBus = EventBus;
    exports.FXML = FXML;
    exports.PocketFX = PocketFX;
    exports.SceneManager = SceneManager;
    exports.Security = Security;
    exports.Stage = Stage;

}));
//# sourceMappingURL=pocketfx.umd.js.map
