import { PocketFX } from './Engine.js';

export class SceneManager {
    static async setScene(container, ControllerClass, initData = null) {
        const { root, controller } = await PocketFX.loadView(ControllerClass);
        if (initData && typeof controller.initData === 'function') controller.initData(initData);
        container.replaceChildren(root);
        if (typeof controller.initialize === 'function') await controller.initialize();
        return controller;
    }
}