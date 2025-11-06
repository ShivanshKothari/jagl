import { MultiSelect } from './ui/MultiSelect.js';

/**
 * A popup filter menu component that allows users to select multiple items and apply the selection.
 * 
 * @class
 * @example
 * const menu = new FilterMenu({
 *   values: ['A', 'B', 'C'],
 *   selection: ['A'],
 *   anchor: document.getElementById('filter-btn'),
 *   onApply: (selected) => { console.log(selected); }
 * });
 * 
 * @param {Object} options - Configuration options for the filter menu.
 * @param {Array} options.values - The list of selectable items.
 * @param {Array} options.selection - The initially selected items.
 * @param {HTMLElement} options.anchor - The DOM element to anchor the menu to.
 * @param {Function} options.onApply - Callback invoked with the selected items when the user clicks "Apply".
 */
export class FilterMenu {
    
    /**
     * Creates a new FilterMenu instance and attaches it to the DOM.
     * @param {Object} options - Options for the filter menu (values, selection, anchor, onApply).
     */
    constructor(options) {
        this.onApply = options.onApply;
        this.anchorElement = options.anchor; // For positioning
        
        this.element = this._createMenuElement(options);
        
        document.body.appendChild(this.element);
        
        this._positionMenu();
        
        setTimeout(() => {
            document.addEventListener("click", this.close.bind(this), { once: true });
        }, 0);
    }

    /**
     * Creates a filter menu DOM element with multi-select options and an apply button.
     *
     * @param {Object} options - Configuration options for the menu.
     * @param {Array} options.values - The list of selectable items for the MultiSelect component.
     * @param {Array} options.selection - The initially selected items.
     * @returns {HTMLDivElement} The constructed menu element containing the MultiSelect and apply button.
     */
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


    
    /**
     * Positions the filter menu relative to the anchor element.
     * @private
     */
    _positionMenu() {
        const rect = this.anchorElement.getBoundingClientRect();
        this.element.style.position = 'absolute';
        this.element.style.top = `${rect.bottom + window.scrollY}px`;
        this.element.style.left = `${rect.left + window.scrollX}px`;
        // Add some basic styling
        this.element.style.border = '1px solid #ccc';
        this.element.style.backgroundColor = 'white';
        this.element.style.zIndex = '999';
    }

    /**
     * Closes and removes the filter menu from the DOM.
     */
    close() {
        // Check if the element still exists before trying to remove it
        if (this.element) {
            this.element.remove();
            this.element = null; // Clean up reference
        }
    }
}