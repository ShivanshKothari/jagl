/**
 * @class
 * @description Manages the data for the grid component.
 * It stores both the original, pristine data and a "view" of the data that can be manipulated (e.g., sorted, filtered) without affecting the original source.
 */
export class DataStore {
    /**
     * Creates a new instance of the DataStore class.
     * @param {Array} [dataSource=[]] - The initial array of data to be stored. Defaults to an empty array.
     * @param {Object} [config={}] - Configuration config for the DataStore.
     */
    constructor(dataSource = [], config = {}) {
        this.config = config;
        this.originalData = []; // The pristine, untouched data
        this.viewData = [];     // The data to be displayed (sorted, filtered, etc.)

        this.setData(dataSource);
    }

    /**
     * Sets the main data source for the store.
     * This method processes the data by adding a serial column (sno) if configured,
     * and stores a pristine copy in `originalData` and a working copy in `viewData`.
     * @param {Array} dataSource The array of data objects to be stored.
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
     * Gets a list of unique values for a given column from the original data.
     * @param {string} key - The column key to get unique values for.
     * @returns {Array} An array of unique values.
     */
    getUniqueValues(key) {
        const valueSet = new Set(this.originalData.map(row => row[key]));
        return [...valueSet].sort();
    }

    /**
     * Finds and returns a single record from the original source by its ID.
     * @param {string | number} id - The unique identifier of the record.
     * @param {string} idKey - The property name of the ID field (e.g., 'RecordID', 'id'). Defaults to 'id'.
     * @returns {Object | undefined} The full record object or undefined if not found.
     */
    getRecordById(id, idKey = 'id') {
        
        return this.originalData.find(record => {return idKey.split(',').every((key) => record[key] == id);});
    }

    getKeyFieldValue(keyField, row) {
        return keyField.split(',').map(key => row[key]).join(',');
    }

    /**
     * Sorts the data in `viewData` based on a specified key and order.
     * This is a robust sorting function that handles various data types (strings, numbers, dates, booleans, nulls)
     * and uses a cache to optimize the normalization process.
     * @param {string} key The key of the object to sort by.
     * @param {string} [order="asc"] The sort order, either "asc" for ascending or "desc" for descending.
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
     * Filters the data and updates the viewData.
     * @param {Object} filterMap - An object where keys are column names and values are arrays of accepted values.
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
