import { pb } from '../app.js'; // Pendiente incorporarlo dentro del engine como unidad
import { FXML } from './FXML.js';

export class PocketFX {
    static async loadView(ControllerClass) {
        const viewName = ControllerClass.name.replace('Controller', '');
        const response = await fetch(`/src/views/${viewName}.html`);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html.trim(), 'text/html');
        const rootNode = doc.body.firstElementChild;

        const controller = new ControllerClass();
        controller.pb = pb;
        controller.root = rootNode;

        for (const key of Object.keys(controller)) {
            if (controller[key] instanceof FXML) {
                const elementId = controller[key].id || key; 
                const element = rootNode.id === elementId ? rootNode : rootNode.querySelector(`#${elementId}`);
                if (element) controller[key] = element;
            }
        }
        return { root: rootNode, controller };
    }

    static async inflate(templateName, data, setupFn) {
        const response = await fetch(`/src/views/fragments/${templateName}.html`);
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