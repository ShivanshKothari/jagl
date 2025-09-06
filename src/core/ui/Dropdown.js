/**
 * Dropdown UI component for displaying a customizable list of selectable items.
 *
 * @class
 * @classdesc
 * The Dropdown class provides a simple, configurable dropdown menu that can be attached to any trigger element.
 * It supports custom item rendering, click and hover interactions, and accessibility features.
 *
 * @example
 * const trigger = document.getElementById('dropdown-trigger');
 * const dropdown = new Dropdown(trigger, {
 *   items: [
 *     { label: 'Option 1', onClick: () => alert('Option 1 selected') },
 *     { label: 'Option 2' }
 *   ],
 *   onSelect: (item, index) => console.log('Selected:', item, index),
 *   config: {
 *     panel: { background: '#fff' },
 *     itemHover: { background: '#eee' }
 *   }
 * });
 *
 * @param {HTMLElement} triggerElement - The element that triggers the dropdown when clicked.
 * @param {Object} options - Configuration options for the dropdown.
 * @param {Array<Object>} options.items - Array of item objects to display in the dropdown.
 * @param {Function} [options.onSelect] - Default callback function when an item is selected.
 * @param {Object} [options.config] - Custom style configuration for panel, list, item, and itemHover.
 *
 * @property {HTMLElement} triggerElement - The trigger element for the dropdown.
 * @property {Array<Object>} items - The list of items displayed in the dropdown.
 * @property {Function} [onSelect] - Default callback for item selection.
 * @property {HTMLElement|null} panel - The dropdown panel element.
 * @property {boolean} isOpen - Indicates whether the dropdown is open.
 * @property {Object} config - Merged style configuration for the dropdown.
 *
 * @method toggle - Toggles the open/closed state of the dropdown.
 * @method open - Opens the dropdown panel.
 * @method close - Closes the dropdown panel.
 */
export class Dropdown {
    /**
     * Creates an instance of a Dropdown.
     * @param {HTMLElement} triggerElement The element that the user clicks to open the dropdown.
     * @param {Object} options Configuration options for the dropdown.
     * @param {Array<Object>} options.items An array of item objects to display.
     * @param {Function} [options.onSelect] A default callback function when an item is selected.
     */
    constructor(triggerElement, options) {
        this.triggerElement = triggerElement;
        this.items = options.items || [];
        this.onSelect = options.onSelect;
        this.panel = null;
        this.isOpen = false;

        // ✅ Default config merged with user's config
        const defaultConfig = {
            panel: { background: 'white', border: '1px solid #ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: '1000' },
            list: { listStyle: 'none', margin: '0', padding: '5px 0' },
            item: { padding: '8px 15px', cursor: 'pointer' },
            itemHover: { background: '#f0f0f0' }
        };
        this.config = { ...defaultConfig, ...options.config };

        this._attachTriggerEvents();
        this.toggle()
    }

    /**
     * Creates and renders the dropdown panel with a list of selectable items.
     * 
     * - Initializes the panel and list elements with configured styles.
     * - Iterates over `this.items` to create list items, applying styles and attributes.
     * - Adds event listeners for hover and click interactions on each item.
     * - Appends the panel to the document body.
     * 
     * @private
     * @returns {void}
     */
    _createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'dropdown-panel';
        Object.assign(this.panel.style, this.config.panel); // Apply panel styles

        const list = document.createElement('ul');
        list.className = 'dropdown-list';
        Object.assign(list.style, this.config.list); // Apply list styles

        this.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'dropdown-item';
            li.textContent = item.label;
            Object.assign(li.style, this.config.item); // Apply item styles

            // Apply any additional attributes
            if (item.attrs) {
                Object.keys(item.attrs).forEach(attr => {
                    li.setAttribute(attr, item.attrs[attr]);
                });
            }

            li.addEventListener('mouseenter', () => Object.assign(li.style, this.config.itemHover));
            li.addEventListener('mouseleave', () => Object.assign(li.style, this.config.item));

            li.addEventListener('click', () => {
                if (typeof item.onClick === 'function') {
                    item.onClick(item, index);
                } else if (typeof this.onSelect === 'function') {
                    this.onSelect(item, index);
                }
                this.close();
            });
            list.appendChild(li);
        });

        this.panel.appendChild(list);
        document.body.appendChild(this.panel);
    }


    /**
     * Attaches click event listener to the trigger element for the dropdown.
     * When the trigger is clicked, it stops the event from propagating and toggles the dropdown.
     * @private
     */
    _attachTriggerEvents() {
        this.triggerElement.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggle();
        });
    }

    

    /**
     * Positions the dropdown panel absolutely below the trigger element,
     * aligning its left edge with the trigger's left edge and adding a small vertical offset.
     * Takes into account the current scroll position of the window.
     *
     * @private
     */
    _positionPanel() {
        const rect = this.triggerElement.getBoundingClientRect();
        this.panel.style.position = 'absolute';
        this.panel.style.top = `${rect.bottom + window.scrollY + 2}px`;
        this.panel.style.left = `${rect.left + window.scrollX}px`;
    }

    /**
     * Toggles the open or closed state of the dropdown.
     * If the dropdown is currently open, it will be closed.
     * If it is closed, it will be opened.
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Opens the dropdown panel.
     * - Sets the dropdown state to open.
     * - Updates the trigger element's ARIA attribute for accessibility.
     * - Creates the dropdown panel if it doesn't exist.
     * - Positions and displays the panel.
     * - Adds a one-time event listener to close the dropdown when clicking outside.
     */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.triggerElement.setAttribute('aria-expanded', 'true');

        if (!this.panel) {
            this._createPanel();
        }

        this._positionPanel();
        this.panel.style.display = 'block';

        // Add listeners to close the dropdown
        setTimeout(() => {
            document.addEventListener('click', this.close.bind(this), { once: true });
        }, 0);
    }

    /**
     * Closes the dropdown panel if it is currently open.
     * Sets the `isOpen` property to false, updates the `aria-expanded` attribute
     * for accessibility, and hides the dropdown panel if it exists.
     */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.triggerElement.setAttribute('aria-expanded', 'false');
        if (this.panel) {
            this.panel.style.display = 'none';
        }
    }
}