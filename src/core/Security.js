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

    static safeSetAttribute(element, name, value) {
        if (element && typeof value !== 'undefined' && value !== null) {
            // attributes are always serialized as strings; sanitize via text
            element.setAttribute(name, String(value));
        }
    }
}