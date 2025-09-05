import { DataStore } from './DataStore.js';
import { Renderer } from './Renderer.js';
import { EventManager } from './EventManager.js';
import { FilterMenu } from './FilterMenu.js';


/**
 * @class
 * @description Represents a data grid component that handles data management, rendering, and user interactions like sorting.
 * It acts as the central controller, orchestrating the interactions between the `DataStore`, `Renderer`, and `EventManager`.
 */
export class Grid {
    /**
     * Creates an instance of the Grid.
     * @param {HTMLElement} containerElement - The DOM element where the grid will be rendered.
     * @param {Object} [options={}] - The configuration options for the grid.
     * @param {Array<Object>} [options.columns=[]] - An array of column definitions to control rendering.
     * @param {boolean} [options.addSerialColumn=false] - A flag to automatically add a serial number column.
     * @param {Object} [options.dataSource] - The data source configuration.
     * @param {string} [options.dataSource.mode] - The data mode, either 'url' or 'json'.
     * @param {string|Array} [options.dataSource.source] - The URL string or the JSON data array.
     */
    constructor(containerElement, options = {}) {
        this.container = containerElement;

        this.options = {
            columns: [],
            addSerialColumn: false,
            filterData: true,
            style: { overflow: 'scroll' },
            ...options // User options override defaults
        };
        this.sortState = { key: null, order: 'asc', ...options.sorting };
        this.filterState = {};
        this.activeFilterMenu = null;

        this.store = new DataStore([], { addSerialColumn: this.options.addSerialColumn });
        this.renderer = new Renderer(this.container);
        this.eventManager = new EventManager(this);

        this.init();
    }

    /**
     * Initializes the grid by fetching and loading data based on the configured data source.
     * It supports two modes: fetching from a URL or using a local JSON array.
     * @async
     * @private
     */
    async init() {

        // GUARD CLAUSE: Do nothing if no data source is provided.
        if (!this.options.dataSource) {
            this.render(); // Render an empty state
            return;
        }

        const mode = this.options.dataSource.mode?.toLowerCase();
        const source = this.options.dataSource.source;

        if (mode === 'url') {
            await this.loadFromURL(source);
        } else if (mode === 'json') {
            this.loadFromJSON(source);
        } else {
            console.error("Unsupported mode. Available modes: url, json");
        }
    }

    /**
     * A private helper method that sets the data in the store, and then automatically
     * generates columns if not provided, before triggering a render.
     * @param {Array<Object>} data - The data array to be processed and rendered.
     * @private
     */
    _setDataAndRender(data) {
        this.store.setData(data);

        // If no columns are defined by the user, generate them automatically
        if (this.options.columns.length === 0 && this.store.getData().length > 0) {
            this.options.columns = Object.keys(this.store.getData()[0]).map((key, index) => ({
                key: key,
                title: key,
                index: (key === 'sno') ? 0 : index + 1 // If it's 'sno', its index is 0, otherwise normal
            }));

        }

        this.render();
    }

    /**
     * Fetches data from a given URL, processes the JSON response, and updates the grid.
     * @param {string} url - The URL from which to fetch the data.
     * @async
     */
    async loadFromURL(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            this._setDataAndRender(data); // Helper
        } catch (error) {
            console.error("Failed to fetch grid data from URL:", error);
        }
    }

    /**
     * Loads data directly from a provided JSON array and updates the grid.
     * @param {Array<Object>} data - The JSON data array to load.
     */
    loadFromJSON(data) {
        this._setDataAndRender(data); // Helper
    }

    /**
     * Triggers the rendering of the grid using the current state of the data store.
     * It passes the current `viewData` and config object with columns, filterData flag and style to the renderer.
     */
    render() {
        // Pass the configured columns to the renderer
        this.renderer.render(this.store.getData(), { columns: this.options.columns, filterData: this.options.filterData, style: { ...(this.options.style ? this.options.style : {}) } });
    }

    /**
     * Handles the logic for sorting when a header is clicked.
     * It updates the sort state and triggers a sort operation.
     * @param {string} key - The data key of the column to sort.
     */
    handleHeaderClick(key) {
        if (this.sortState.key === key) {
            // If clicking the same column, reverse the order
            this.sortState.order = this.sortState.order === 'asc' ? 'desc' : 'asc';
        } else {
            // If clicking a new column, sort ascending
            this.sortState.key = key;
            this.sortState.order = 'asc';
        }
        this.sort(this.sortState.key, this.sortState.order);
    }

    /**
     * Handles the logic for filtering when the filter icon is clicked.
     * It updates gets unique values from the column and displays them in the form of multi select menu.
     * On item click, updates the filter state and triggers a filter operation.
     * @param {string} key - The data key of the column to filter.
     * @param {HTMLElement} - Anchor element to calculate position.
     */
    handleFilterIconClick(key, anchorElement) {

        if (this.activeFilterMenu && this.activeFilterMenu.key === key) {
            this.activeFilterMenu.close();
            this.activeFilterMenu = null;
            return;
        }
        // If another menu is open, close it first
        if (this.activeFilterMenu) {
            this.activeFilterMenu.close();
        }

        const uniqueValues = this.store.getUniqueValues(key);
        const currentSelection = this.filterState[key] || [];

        const newMenu = new FilterMenu({
            values: uniqueValues,
            selection: currentSelection,
            anchor: anchorElement,
            onApply: (newSelection) => {
                this.applyFilter(key, newSelection);
            }
        });

        newMenu.key = key; // Tag the menu with its column key
        this.activeFilterMenu = newMenu;
    }

    /**
     * Sorts the data in the store and re-renders the grid.
     * @param {string} key - The data key to sort by.
     * @param {string} order - The sort order ('asc' or 'desc').
     */
    sort(key, order) {
        this.store.sortData(key, order);
        this.render();
    }

    applyFilter(key, selection) {
        if (selection && selection.length > 0) {
            this.filterState[key] = selection;
        } else {
            delete this.filterState[key];
        }

        this.options.columns.forEach(column => {
            column.hasFilter = Object.hasOwn(this.filterState, column.key) && this.filterState[column.key];
        })

        this.store.filterData(this.filterState);
        // After filtering, you might want to re-sort based on the current sortState
        this.store.sortData(this.sortState.key, this.sortState.order);
        this.render();
    }
}