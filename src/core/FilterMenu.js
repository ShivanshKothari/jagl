// src/core/FilterMenu.js
import { MultiSelect } from './ui/MultiSelect.js';

export class FilterMenu {
    constructor(options) {
        this.onApply = options.onApply;
        this.anchorElement = options.anchor; // For positioning
        
        // 1. Create the menu element in memory
        this.element = this._createMenuElement(options);

        // 2. ✅ APPEND IT to the live DOM
        document.body.appendChild(this.element);

        // 3. Position it correctly on the screen
        this._positionMenu();
        
        // 4. Add a listener to close the menu when the user clicks elsewhere
        setTimeout(() => {
            document.addEventListener("click", this.close.bind(this), { once: true });
        }, 0);
    }

    _createMenuElement(options) {
        const menu = document.createElement('div');
        menu.className = 'filter-menu';
        // Stop clicks inside the menu from closing it
        menu.addEventListener('click', e => e.stopPropagation());

        const multiSelect = new MultiSelect({
            items: options.values,
            initialSelection: options.selection
        });

        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply';
        applyButton.addEventListener('click', () => {
            this.onApply(multiSelect.getSelection());
            this.close();
        });

        menu.appendChild(multiSelect.element);
        menu.appendChild(applyButton);
        return menu;
    }

    _positionMenu() {
        const rect = this.anchorElement.getBoundingClientRect();
        this.element.style.position = 'absolute';
        this.element.style.top = `${rect.bottom + window.scrollY}px`;
        this.element.style.left = `${rect.left + window.scrollX}px`;
        // Add some basic styling
        this.element.style.border = '1px solid #ccc';
        this.element.style.backgroundColor = 'white';
        this.element.style.zIndex = '100';
    }

    close() {
        // Check if the element still exists before trying to remove it
        if (this.element) {
            this.element.remove();
            this.element = null; // Clean up reference
        }
    }
}