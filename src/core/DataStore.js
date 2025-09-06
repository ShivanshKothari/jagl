/**
 * DataStore is a utility class for managing, sorting, and filtering tabular data.
 * It maintains both the original data and a viewable subset that can be sorted or filtered.
 *
 * @class
 *
 * @example
 * const store = new DataStore([{ id: 1, name: 'Alice' }], { addSerialColumn: true });
 * store.sortData('name', 'desc');
 * const filtered = store.getData();
 *
 * @param {Array<Object>} [dataSource=[]] - The initial array of data objects to store.
 * @param {Object} [config={}] - Configuration options for the DataStore.
 * @param {boolean} [config.addSerialColumn] - If true, adds a serial number column ('sno') to each data row.
 *
 * @property {Object} config - Configuration options for the DataStore.
 * @property {Array<Object>} originalData - The pristine, untouched data array.
 * @property {Array<Object>} viewData - The current working data array (may be sorted or filtered).
 *
 * @method setData
 * Sets the main data source for the store, optionally adding a serial column.
 * @param {Array<Object>} dataSource - The array of data objects to be stored.
 *
 * @method getData
 * Retrieves the current processed data from the store.
 * @returns {Array<Object>} The processed array of data objects.
 *
 * @method getUniqueValues
 * Gets unique values for a given key from the original data.
 * @param {string} key - The key to extract unique values for.
 * @returns {Array} Array of unique values.
 *
 * @method getRecordById
 * Gets a record by its key field value.
 * @param {string|number} id - The value of the key field.
 * @param {string} [idKey='id'] - The property name of the key field (supports comma-separated composite keys).
 * @returns {Object|undefined} The matching record or undefined if not found.
 *
 * @method getKeyFieldValue
 * Gets the value of the key field for a given row.
 * @param {string} keyField - The key field name (can be comma-separated for composite keys).
 * @param {Object} row - The row data object.
 * @returns {string|number} The value of the key field.
 *
 * @method sortData
 * Sorts the view data by a given key and order.
 * Handles various data types and uses a cache to optimize normalization.
 * @param {string} key - The key to sort by.
 * @param {string} [order="asc"] - The sort order ('asc' or 'desc').
 *
 * @method filterData
 * Filters the view data based on the provided filter state.
 * @param {Object} filterMap - An object mapping column keys to arrays of accepted values.
 */
export class DataStore {
    /**
     * Creates a new instance of the DataStore class.
     * @param {Array} [dataSource=[]] - The initial array of data to be stored.
     * @param {Object} [config={}] - Configuration options for the DataStore (e.g., addSerialColumn).
     */
    constructor(dataSource = [], config = {}) {
        this.config = config;
        this.originalData = []; // The pristine, untouched data
        this.viewData = [];     // The data to be displayed (sorted, filtered, etc.)

        this.setData(dataSource);
    }

    /**
     * Sets the main data source for the store.
     * Processes the data by adding a serial column (sno) if configured, and stores a pristine copy in `originalData` and a working copy in `viewData`.
     * @param {Array} dataSource - The array of data objects to be stored.
     */
    setData(dataSource) {
        let dataToStore = [...dataSource];

        // Add sno if not present
        if (this.config.addSerialColumn && dataToStore.length > 0) {
            dataToStore.forEach((element, index) => {
                element['sno'] = index + 1;
            });
        }

        this.originalData = dataToStore;
        this.viewData = [...this.originalData];
    }

    /**
     * Retrieves the current processed data from the store.
     * This data is the viewData, which may have been sorted or filtered.
     * @returns {Array} The processed array of data objects.
     */
    getData() {
        return this.viewData;
    }

    /**
     * Gets unique values for a given key from the original data.
     * @param {string} key - The key to extract unique values for.
     * @returns {Array} Array of unique values.
     */
    getUniqueValues(key) {
        const valueSet = new Set(this.originalData.map(row => row[key]));
        return [...valueSet].sort();
    }

    /**
     * Gets a record by its key field value.
     * @param {string|number} id - The value of the key field.
     * @param {string} idKey - The property name of the key field (e.g., 'RecordID', 'id'). Defaults to 'id'.
     * @returns {Object|undefined} The matching record or undefined if not found.
     */
    getRecordById(id, idKey = 'id') {
        
        return this.originalData.find(record => {return idKey.split(',').every((key) => record[key] == id);});
    }

    /**
     * Gets the value of the key field for a given row.
     * @param {string} keyField - The key field name (can be comma-separated for composite keys).
     * @param {Object} row - The row data object.
     * @returns {string|number} The value of the key field.
     */
    getKeyFieldValue(keyField, row) {
        return keyField.split(',').map(key => row[key]).join(',');
    }

    /**
     * Sorts the view data by a given key and order.
     * Handles various data types (strings, numbers, dates, booleans, nulls) and uses a cache to optimize normalization.
     * @param {string} key - The key to sort by.
     * @param {string} [order="asc"] - The sort order ('asc' or 'desc').
     */
    sortData(key, order = "asc") {
        const dir = order === "asc" ? 1 : -1;
        const cache = new Map();

        const normalize = (val) => {
            if (cache.has(val)) return cache.get(val);

            let normVal = val;

            // Handle null/undefined
            if (normVal == null) {
                cache.set(val, null);
                return null;
            }

            // Convert Dates
            if (normVal instanceof Date || (!isNaN(Date.parse(normVal)))) {
                normVal = new Date(normVal).getTime();
                cache.set(val, normVal);
                return normVal;
            }

            // Normalize booleans
            if (typeof normVal === "boolean") {
                normVal = normVal ? 1 : 0;
                cache.set(val, normVal);
                return normVal;
            }

            // Try numeric conversion
            if (!isNaN(normVal) && normVal !== "") {
                normVal = Number(normVal);
                cache.set(val, normVal);
                return normVal;
            }

            // Default to string (case-insensitive)
            normVal = String(normVal).toLowerCase();
            cache.set(val, normVal);
            return normVal;
        };

        // Sort viewData, not the original source
        this.viewData.sort((a, b) => {
            let valA = normalize(a[key]);
            let valB = normalize(b[key]);

            if (valA === valB) return 0;
            if (valA == null) return 1 * dir;
            if (valB == null) return -1 * dir;

            if (typeof valA === "number" && typeof valB === "number") {
                return (valA - valB) * dir;
            }

            return String(valA).localeCompare(String(valB), undefined, { sensitivity: "base" }) * dir;
        });
    }

    /**
     * Filters the view data based on the provided filter state.
     * @param {Object} filterMap - An object mapping column keys to arrays of accepted values.
     */
    filterData(filterMap = {}) {
        const filterKeys = Object.keys(filterMap);


        if (filterKeys.length === 0) {
            this.viewData = [...this.originalData];
            return;
        }


        this.viewData = this.originalData.filter(row => {
            // Use `every()` for an efficient "AND" check.
            // It checks if the row passes the test for ALL filter keys.
            // It also short-circuits, stopping as soon as a condition fails.
            return filterKeys.every(key => {
                // If the row's value for the key is in our list of allowed values, it passes.
                return filterMap[key].includes(row[key]);
            });
        });
    }
}
