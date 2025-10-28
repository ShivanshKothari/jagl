import { DataStore } from './DataStore.js';
import { Renderer } from './Renderer.js';
import { EventManager } from './EventManager.js';
import { FilterMenu } from './FilterMenu.js';
import { Dropdown } from './ui/Dropdown.js';
import { ExcelExporter } from './ui/ExcelExporter.js';


/**
 * Represents a dynamic, interactive data grid component.
 * * The `Grid` class provides functionality for rendering tabular data with features such as
 * sorting, filtering, pagination, and customizable columns. It supports data loading from
 * both remote URLs and local JSON arrays, and allows for extensible configuration.
 * * @class
 * * @example
 * const grid = new Grid(document.getElementById('gridContainer'), {
 * columns: [{ key: 'name', title: 'Name' }, { key: 'age', title: 'Age' }],
 * keyField: 'id',
 * dataSource: { mode: 'json', source: [{ id: 1, name: 'Alice', age: 30 }] },
 * customCSS: ['/path/to/bootstrap.min.css', '/path/to/my-grid-styles.css'] // NEW: Custom CSS array
 * paging: { enabled: true, pageSize: 5 }
 * });
 * * // Shadow DOM rendering
 * const gridShadow = new Grid(document.getElementById('shadowContainer'), {
 * columns: [{ key: 'name', title: 'Name' }, { key: 'age', title: 'Age' }],
 * keyField: 'id',
 * dataSource: { mode: 'json', source: [{ id: 1, name: 'Alice', age: 30 }] },
 * renderInShadowDom: true // Flag to enable Shadow DOM rendering
 * });
 * * @param {HTMLElement} containerElement - The DOM element where the grid will be rendered.
 * @param {Object} [config={}] - Configuration options for the grid.
 * @param {Array<Object>} [config.columns=[]] - Array of column definitions.
 * @param {boolean} [config.addSerialColumn=false] - Whether to automatically add a serial number column.
 * @param {boolean} [config.filterData=true] - Whether filtering is enabled.
 * @param {Object} [config.paging] - Pagination configuration.
 * @param {boolean} [config.paging.enabled=true] - Whether pagination is enabled.
 * @param {number} [config.paging.pageSize=10] - Number of records per page.
 * @param {Object} [config.dataSource] - Data source configuration.
 * @param {string} [config.dataSource.mode] - Data mode: 'url' or 'json'.
 * @param {string|Array} [config.dataSource.source] - URL string or JSON data array.
 * @param {string} [config.keyField] - Unique key field for identifying records.
 * @param {Object} [config.sorting] - Initial sorting configuration.
 * @param {Object} [config.style] - Custom style configuration for the grid container.
 * @param {Object} [config.actionColumn] - Configuration for row action menus.
 * @param {boolean} [config.renderInShadowDom=false] - Whether to render the grid inside a Shadow DOM.
 * @param {string} [config.dateFormat='yyyy-MM-dd HH:mm'] - Format string for date values (e.g., 'yyyy-MM-dd HH:mm').
 * @param {Array<string>} [config.customCSS=[]] - An array of URLs for external stylesheets to be applied. // NEW
 * * @property {HTMLElement} container - The container element for the grid.
 * @property {Object} config - The configuration object for the grid.
 * @property {Object} sortState - The current sorting state.
 * @property {Object} filterState - The current filter state.
 * @property {Object} pagingState - The current pagination state.
 * @property {DataStore} store - The data store instance managing grid data.
 * @property {Renderer} renderer - The renderer instance responsible for DOM updates.
 * @property {EventManager} eventManager - The event manager for grid events.
 * @property {FilterMenu|null} activeFilterMenu - The currently open filter menu, if any.
 */
export class Grid {
    /**
     * Creates an instance of the Grid.
     * @param {HTMLElement} containerElement - The DOM element where the grid will be rendered.
     * @param {Object} [config={}] - The configuration config for the grid.
     * @param {Array<Object>} [config.columns=[]] - An array of column definitions to control rendering.
     * @param {boolean} [config.addSerialColumn=false] - A flag to automatically add a serial number column.
     * @param {Object} [config.dataSource] - The data source configuration.
     * @param {string} [config.dataSource.mode] - The data mode, either 'url' or 'json'.
     * @param {string|Array} [config.dataSource.source] - The URL string or the JSON data array.
     * @param {boolean} [config.renderInShadowDom=false] - Whether to render the grid inside a Shadow DOM.
     * @param {string} [config.dateFormat='yyyy-MM-dd HH:mm'] - Format string for date values (e.g., 'yyyy-MM-dd HH:mm').
     * @param {Array<string>} [config.customCSS=[]] - An array of URLs for external stylesheets to be applied. // NEW
     */
    constructor(containerElement, config = {}) {
        this.container = containerElement;

        this.config = {
            columns: [],
            addSerialColumn: false,
            filterData: true,
            paging: {
                enabled: true,
                pageSize: 10 // Default page size
            },
            style: { overflow: 'scroll', margin: 0 },
            renderInShadowDom: false,
            dateFormat: 'yyyy-MM-dd HH:mm',
            customCSS: [], // NEW DEFAULT: empty array
            ...config // User config override defaults
        };

        // For sticky headers
        this.config.thStyle = {...this.config.thStyle, ...{ position: 'sticky', top: '0', zIndex: 2, cursor: 'pointer' } };
        //this.config.customCSS = [...this.config.customCSS, ...['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css']]; 

        if (!this.config.keyField) {
            console.error("Grid requires a unique 'keyField' in the configuration for identifying records.");
        }
        this.sortState = { key: null, order: 'asc', ...config.sorting };
        this.filterState = {};
        this.activeFilterMenu = null;
        this.pagingState = {
            currentPage: 1,
            pageSize: this.config.paging.pageSize,
            totalRecords: 0,
            totalPages: 0,
        };

        this.store = new DataStore([], { addSerialColumn: this.config.addSerialColumn });
        
        // --- START Shadow DOM/Renderer Setup ---
        let renderRoot = containerElement;
        if (this.config.renderInShadowDom) {
            // Use existing shadowRoot or create a new one
            if (containerElement.shadowRoot) {
                renderRoot = containerElement.shadowRoot;
            } else {
                // Attach a shadow root (mode 'open' allows JS access from outside)
                renderRoot = containerElement.attachShadow({ mode: 'open' });
            }
        }
        // Pass the chosen root element (either original container or shadowRoot) to the Renderer
        this.renderer = new Renderer(renderRoot); 
        // --- END Shadow DOM/Renderer Setup ---
        
        this.eventManager = new EventManager(this);
        this.exporter = new ExcelExporter();

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
        if (!this.config.dataSource) {
            this.render(); // Render an empty state
            return;
        }

        // Determine the mode and load data accordingly
        const mode = this.config.dataSource.mode?.toLowerCase();
        const source = this.config.dataSource.source;
        const urlOpts = this.config.dataSource.urlOpts || {};

        if (mode === 'url') {
            await this.loadFromURL(source, urlOpts);
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

        // Reset to page 1 whenever new data is set
        this.pagingState.currentPage = 1;

        // If no columns are defined by the user, generate them automatically
        if (this.config.columns.length === 0 && this.store.getData().length > 0) {
            this.config.columns = Object.keys(this.store.getData()[0]).map((key, index) => ({
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
    async loadFromURL(url, opts) {
        try {
            const response = await fetch(url, opts);
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
        const fullData = this.store.getData();
        this.pagingState.totalRecords = fullData.length;
        this.pagingState.totalPages = Math.ceil(this.pagingState.totalRecords / this.pagingState.pageSize);

        let dataToRender = fullData;

        if (this.config.paging.enabled) {
            const start = (this.pagingState.currentPage - 1) * this.pagingState.pageSize;
            const end = start + this.pagingState.pageSize;
            dataToRender = fullData.slice(start, end);
        }

        // Pass the configured columns to the renderer
        this.renderer.render(dataToRender, { ...this.config }, this.pagingState);
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

        if (this.activeFilterMenu) {
            this.activeFilterMenu.close();
            this.activeFilterMenu = null;
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
     * Handles the click event on the action menu for a grid row.
     * Retrieves the row data using the provided key field, constructs dropdown items
     * based on the configured actions, and displays a dropdown menu at the trigger element.
     *
     * @param {*} keyField - The unique identifier value for the row.
     * @param {HTMLElement} triggerElement - The DOM element that triggered the action menu.
     */
    handleActionMenuClick(keyField, triggerElement) {

        const rowData = this.store.getRecordById(keyField, this.config.keyField);
        if (!rowData) return;

        const dropdownItems = this.config.actionColumn.actions.map(action => {
            const keyField = this.store.getKeyFieldValue(this.config.actionColumn.keyField, rowData);
            return {
                label: action.label,
                attrs: { key: keyField, ...action.attrs },
                onClick: () => action.onClick(rowData)
            };
        });


        new Dropdown(triggerElement, {
            items: dropdownItems,
            // You can also pass a custom style config here if you want
            // config: { panel: { background: 'lightblue' } } 
        });
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

    /**
     * Applies a filter to the grid based on the provided key and selection.
     * Updates the filter state, marks columns with active filters, resets pagination,
     * applies the filter and sort to the data store, and re-renders the grid.
     *
     * @param {string} key - The key identifying the column to filter.
     * @param {Array} selection - The selected filter values for the column.
     */
    applyFilter(key, selection) {
        if (selection && selection.length > 0) {
            this.filterState[key] = selection;
        } else {
            delete this.filterState[key];
        }

        const markFilteredColumns = (column) => {
            column.hasFilter = Object.hasOwn(this.filterState, column.key) && this.filterState[column.key];
            if (column.children && column.children.length > 0) {
                column.children.forEach(child => markFilteredColumns(child));
            }
        }
        this.config.columns.forEach(col => markFilteredColumns(col));

        // Reset to page 1 after filtering
        this.pagingState.currentPage = 1;

        this.store.filterData(this.filterState);
        // After filtering, you might want to re-sort based on the current sortState
        this.store.sortData(this.sortState.key, this.sortState.order);
        this.render();
    }

    /**
     * Navigates to the specified page number if it is within the valid range.
     *
     * @param {number} pageNumber - The page number to navigate to (1-based index).
     * @returns {void}
     */
    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.pagingState.totalPages) {
            return; // Invalid page number
        }
        this.pagingState.currentPage = pageNumber;
        this.render();
    }

    /**
     * Exports the current grid view to an Excel file.
     * It uses the rendered table from the DOM.
     * @param {string} filename - The name for the exported file.
     */
    exportToExcel(filename = 'grid-export.xls') {
        // The table is managed by the Renderer, so we get it from there
        const tableElement = this.renderer.table;
        if (tableElement) {
            this.exporter.export(tableElement, filename, 'Grid Data');
        } else {
            console.error("Cannot export: Grid is not rendered yet.");
        }
    }

    startEdit(rowData) {
        this.renderer.showEditForm(rowData, this.config.editForm, (updatedData) => {
            this.store.updateRecord(this.config.keyField, updatedData);
            this.render();
        });
    }

    endEdit() {
        this.renderer.hideEditForm();
    }
}