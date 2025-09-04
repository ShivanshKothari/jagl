export class EventManager {
    constructor(gridInstance) {
        this.grid = gridInstance;
        this.container = gridInstance.container;
        this.attachHeaderEvents();
    }

    attachHeaderEvents() {
        this.container.addEventListener('click', (event) => {
            const headerCell = event.target.closest('th');
            if (!headerCell) return;

            const key = headerCell.dataset.key;
            if (key) {
                
                this.grid.handleHeaderClick(key);
            }
        });
    }
}