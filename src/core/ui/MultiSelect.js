// src/core/ui/MultiSelect.js
export class MultiSelect {
    constructor(options, config) {
        this.items = options.items || []; // e.g., ['Active', 'Inactive']
        this.selection = new Set(options.initialSelection || []);
        this.config = { style: { minWidth: '70px', maxHeight: '70px', padding: '0 8px', listStyleType: 'none' }, scroll: { speed: 1 }, children: { style: {} }, ...config }

        this.element = this.createListElement();
    }

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

    getSelection() {
        return [...this.selection];
    }
}