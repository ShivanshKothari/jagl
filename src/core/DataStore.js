export class DataStore {
    constructor(dataSource = [], options = {}) {
        this.options = options;
        this.originalData = []; // The pristine, untouched data
        this.viewData = [];     // The data to be displayed (sorted, filtered, etc.)
        
        this.setData(dataSource);
    }

    setData(dataSource) {
        let dataToStore = [...dataSource]; 

        // Add sno if not present
        if (this.options.addSerialColumn && dataToStore.length > 0) {
            dataToStore.forEach((element, index) => {
                element['sno'] = index + 1;
            });
        }

        this.originalData = dataToStore;
        this.viewData = [...this.originalData];
    }

    // This now returns the processed data
    getData() {
        return this.viewData;
    }

    // ✅ This is your existing, excellent sort logic
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


}
