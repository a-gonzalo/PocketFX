export class EventBus {
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