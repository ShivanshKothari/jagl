import { DataStore } from './DataStore.js';
import { Renderer } from './Renderer.js';
import { EventManager } from './EventManager.js';


export class Grid {
    constructor(containerElement, options = {}) {
        this.container = containerElement;

        // ✅ Set up default options and merge with user options
        this.options = {
            columns: [],
            addSerialColumn: false,
            ...options // User options override defaults
        };
        this.sortState = { key: null, order: 'asc', ...options.sorting };

        this.store = new DataStore([], { addSerialColumn: this.options.addSerialColumn });
        this.renderer = new Renderer(this.container);
        this.eventManager = new EventManager(this);

        this.init();
    }

    // Inside the Grid class
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

    // Inside the Grid class
    _setDataAndRender(data) {

        this.store.setData(data);

        // If no columns are defined by the user, generate them automatically
        if (this.options.columns.length === 0 && this.store.getData().length > 0) {

            this.options.columns = Object.keys(this.store.getData()[0]).map((key, index) => ({
                key: key,
                title: key,
                index: (key === 'sno') ? 0 : index + 1 // If it's 'sno', its index is 0, otherwise normal
            }));

        } else if (this.options.columns.length < Object.keys(this.store.getData()[0]).length) {
            console.error("Not all columns defined.")
        }

        this.render();
    }


    async loadFromURL(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            this._setDataAndRender(data); // Helper
        } catch (error) {
            console.error("Failed to fetch grid data from URL:", error);
        }
    }

    loadFromJSON(data) {
        this._setDataAndRender(data); // Helper
    }

    render() {
        // Pass the configured columns to the renderer
        this.renderer.render(this.store.getData(), this.options.columns);
    }

    /**
    * ✅ Handles the logic for sorting when a header is clicked.
    * This logic now lives in the controller, where it belongs.
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

    sort(key, order) {
        this.store.sortData(key, order);
        this.render();
    }
}