export class Security {
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
}