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
        this.attachEvents();
    }

    /**
     * Attaches a 'click' event listener to the grid container to handle header clicks.
     * This listener delegates the event to the correct header cell and triggers
     * the sorting logic in the main grid instance.
     */
    attachEvents() {
        this.container.addEventListener('click', (event) => {
            // --- Pager Click Logic ---
            const pagerButton = event.target.closest('.grid-pager button');
            if (pagerButton && !pagerButton.disabled) {
                const pageNumber = parseInt(pagerButton.dataset.page, 10);
                this.grid.goToPage(pageNumber);
                return; // Stop processing
            }

            // --- Header Click Logic ---
            const headerCell = event.target.closest('th');
            if (!headerCell) return;

            const key = headerCell.dataset.key;

            if (event.target.classList.contains('filter-icon')) {
                event.stopPropagation();
                this.grid.handleFilterIconClick(key, event.target);
            } else {
                this.grid.handleHeaderClick(key);
            }
        });
    }
}