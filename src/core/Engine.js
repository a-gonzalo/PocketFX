import { pb } from '../app.js'; // Pendiente incorporarlo dentro del engine como unidad
import { FXML } from './FXML.js';

export class PocketFX {
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
    static async loadView(ControllerClass) {
        const viewName = ControllerClass.name.replace('Controller', '');
        let html;

        if (this.#viewCache.has(viewName)) {
            html = this.#viewCache.get(viewName);
        } else {
            const response = await fetch(`/src/views/${viewName}.html`);
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

// register the global PocketBase instance by default so controllers can simply
// call `this.services.get('pb')` if they prefer not to rely on `this.pb`.
PocketFX.registerService('pb', pb);
