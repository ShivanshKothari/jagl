/**
 * @class
 * @description Manages the rendering of a data table into a specified DOM element.
 * It is responsible for creating and updating the table structure, including headers and rows,
 * and ensuring that data is safely rendered to prevent security vulnerabilities.
 */
export class Renderer {
    /**
     * Creates a new instance of the Renderer class.
     * @param {HTMLElement} containerElement - The DOM element where the table will be rendered.
     * @throws {Error} Throws an error if a container element is not provided.
     */
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error("Renderer requires a container element.");
        }
        this.container = containerElement;
        this.table = null;
        this.tbody = null;
    }

    /**
     * Renders the entire grid structure based on the provided data and column configuration.
     * It first clears the container, then builds the table, including the header (`<thead>`)
     * and the body (`<tbody>`), and appends it to the container.
     * @param {Array<Object>} data - The array of data objects to render.
     * @param {Array<Object>} columns - The configuration array for the table's columns.
     */
    render(data, config) {
        this.container.innerHTML = '';
        

        this.table = document.createElement('table');
        const thead = document.createElement('thead');
        this.tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        if (config.style) {
            Object.assign(this.table.style, config.style);
        }

        config.columns.sort((a, b) => a.index - b.index)
        config.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.title; // Title/caption
            th.dataset.key = column.key;   // Key/fieldname
            if (config.filterData){
                th.innerHTML += `&nbsp;&nbsp;<i class="fa fa-filter filter-icon" style="${column.hasFilter ? 'color: gray' : ''}" aria-hidden="true"></i>`
            }
            th.style.padding = '5px 10px';
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        let tbodyInnerHTML = '';
        data.forEach(rowData => {
            let trInnerHTML = '';
            config.columns.forEach(column => {
                const cellValue = rowData[column.key] ?? ''; // Handle undefined values
                trInnerHTML += `<td>${this.escapeHTML(cellValue)}</td>`;
            });
            tbodyInnerHTML += `<tr>${trInnerHTML}</tr>`;
        });
        
        if (!data || data.length === 0) {
            tbodyInnerHTML = `<td colspan="${config.columns.length}">No Data Available</td>`;
            
        }

        this.tbody.innerHTML = tbodyInnerHTML;
        this.table.appendChild(thead);
        this.table.appendChild(this.tbody);
        this.container.appendChild(this.table);
    }

    /**
     * Escapes HTML characters in a string to prevent Cross-Site Scripting (XSS) attacks.
     * It replaces characters like `<`, `>`, `&`, `"`, and `'` with their corresponding
     * HTML entities. If the input is not a string, it is returned as is.
     * @param {*} text - The text to be escaped.
     * @returns {string|*} The escaped string or the original value if not a string.
     */
    escapeHTML(text) {
        if (typeof text !== "string") {
            return text;
        }
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}