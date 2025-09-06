// src/core/ui/MultiSelect.js
/**
 * MultiSelect provides a customizable multi-selection UI component using a styled HTML <ul> element.
 * Each selectable item is rendered as a checkbox within a list item, supporting custom styles and smooth scrolling.
 *
 * @class
 *
 * @example
 * const multi = new MultiSelect(
 *   { items: ['A', 'B', 'C'], initialSelection: ['B'] },
 *   { style: { maxHeight: '100px' }, scroll: { speed: 2 } }
 * );
 * document.body.appendChild(multi.element);
 * console.log(multi.getSelection()); // ['B']
 *
 * @param {Object} options - Configuration options for the MultiSelect.
 * @param {Array} [options.items=[]] - The list of selectable items.
 * @param {Array} [options.initialSelection=[]] - The initially selected items.
 * @param {Object} [config={}] - Additional configuration for styling and behavior.
 * @param {Object} [config.style] - CSS styles for the list element.
 * @param {Object} [config.scroll] - Scroll configuration (e.g., speed).
 * @param {Object} [config.children] - Configuration for child elements.
 *
 * @property {Array} items - The list of selectable items.
 * @property {Set} selection - The set of currently selected items.
 * @property {Object} config - The merged configuration object.
 * @property {HTMLUListElement} element - The root list element for the multi-select UI.
 *
 * @method getSelection - Returns a shallow copy of the current selection as an array.
 */
export class MultiSelect {
    /**
     * Creates an instance of MultiSelect.
     * 
     * @param {Object} options - Configuration options for the MultiSelect.
     * @param {Array} [options.items=[]] - The list of selectable items.
     * @param {Array} [options.initialSelection=[]] - The initially selected items.
     * @param {Object} [config={}] - Additional configuration for styling and behavior.
     * @param {Object} [config.style] - CSS styles for the list element.
     * @param {Object} [config.scroll] - Scroll configuration (e.g., speed).
     * @param {Object} [config.children] - Configuration for child elements.
     */
    constructor(options, config) {
        this.items = options.items || []; // e.g., ['Active', 'Inactive']
        this.selection = new Set(options.initialSelection || []);
        this.config = { style: { minWidth: '70px', maxHeight: '70px', padding: '0 8px', listStyleType: 'none' }, scroll: { speed: 1 }, children: { style: {} }, ...config }

        this.element = this.createListElement();
    }

    /**
     * Creates and returns a styled <ul> element representing a multi-select list.
     * Each item in the list is rendered as a checkbox within a <li> element.
     * The list supports custom styling and smooth scrolling with configurable speed.
     * Selection state is managed via the `this.selection` Set.
     *
     * @returns {HTMLUListElement} The constructed multi-select list element.
     */
    createListElement() {
        const list = document.createElement('ul');
        list.className = 'multiselect-list';
        if (this.config.style) {
            Object.assign(list.style, this.config.style);
        }
        list.style.overflow = 'scroll';
        list.style.overflowX = 'hidden';

        list.addEventListener('wheel', (event) => {
            event.preventDefault(); // Stop the default scroll

            const scrollAmount = event.deltaY / 5 *this.config.scroll.speed; // increase factor to reduce scroll speed

            list.scrollTop += scrollAmount;
        }, { passive: false });


        this.items.forEach(item => {
            const li = document.createElement('li');
            if (this.config.children.style) {
                Object.assign(li.style, this.config.children.style);
            }
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item;
            checkbox.checked = this.selection.has(item);

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selection.add(item);
                } else {
                    this.selection.delete(item);
                }
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${item}`));
            li.appendChild(label);
            list.appendChild(li);
        });

        return list;
    }

    /**
     * Returns a shallow copy of the current selection.
     * @returns {Array} An array containing the selected items.
     */
    getSelection() {
        return [...this.selection];
    }
}