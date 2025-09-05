/**
 * Manages all DOM events for the grid, particularly for user interactions like sorting.
 * @class
 */
export class EventManager {
    /**
     * Creates an instance of EventManager.
     * @param {Grid} gridInstance - The main grid instance to which events will be attached.
     */
    constructor(gridInstance) {
        this.grid = gridInstance;
        this.container = gridInstance.container;
        this.attachHeaderEvents();
    }

    /**
     * Attaches a 'click' event listener to the grid container to handle header clicks.
     * This listener delegates the event to the correct header cell and triggers
     * the sorting logic in the main grid instance.
     */
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