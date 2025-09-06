/**
 * Manages event delegation and handling for a grid component.
 *
 * The EventManager attaches event listeners to the grid's container element to handle
 * user interactions such as action menu triggers, pagination, and header cell actions
 * (sorting and filtering).
 *
 * @class
 * @example
 * const eventManager = new EventManager(gridInstance);
 *
 * @param {Grid} gridInstance - The main grid instance to which events will be attached.
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
     * Attaches event listeners to the container element for handling grid interactions.
     * 
     * Handles the following click events:
     * - Action menu trigger clicks: Delegates to grid's action menu handler.
     * - Pager button clicks: Navigates to the selected page using the grid's pagination handler.
     * - Header cell clicks: Handles sorting or filter icon clicks in the grid header.
     *
     * @returns {void}
     */
    attachEvents() {
        this.container.addEventListener('click', (event) => {
            
            // --- Action Menu Trigger Click Logic ---
            const actionTrigger = event.target.closest('.action-trigger');
            if (actionTrigger) {
                const rowElement = actionTrigger.closest('tr');
                const keyField = rowElement.getAttribute('key');

                // Tell the grid to handle the menu creation
                this.grid.handleActionMenuClick(keyField, actionTrigger);
                return;
            }

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