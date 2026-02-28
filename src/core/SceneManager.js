import { PocketFX } from './Engine.js';

export class SceneManager {
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