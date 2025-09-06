/**
 * A reusable, multipurpose dropdown component.
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


    _attachTriggerEvents() {
        this.triggerElement.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggle();
        });
    }

    

    _positionPanel() {
        const rect = this.triggerElement.getBoundingClientRect();
        this.panel.style.position = 'absolute';
        this.panel.style.top = `${rect.bottom + window.scrollY + 2}px`;
        this.panel.style.left = `${rect.left + window.scrollX}px`;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

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

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.triggerElement.setAttribute('aria-expanded', 'false');
        if (this.panel) {
            this.panel.style.display = 'none';
        }
    }
}