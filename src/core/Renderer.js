export class Renderer {
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error("Renderer requires a container element.");
        }
        this.container = containerElement;
        this.table = null;
        this.tbody = null;
    }

    /**
     * Renders the entire grid structure based on the provided data.
     * @param {Array<Object>} data - The array of data objects to render.
     */
    render(data, columns) { 
        this.container.innerHTML = '';
        if (!data || data.length === 0) {
            this.container.innerHTML = `<p>No Data Available</p>`;
            return;
        }

        this.table = document.createElement('table');
        const thead = document.createElement('thead');
        this.tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        // 1. Generate Headers from the columns config
        columns.sort((a, b) => a.index - b.index)
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.title; // Title/caption
            th.dataset.key = column.key;   // Key/fieldname
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        // 2. Generate Rows and Cells based on the columns config
        let tbodyInnerHTML = '';
        data.forEach(rowData => {
            let trInnerHTML = '';
            columns.forEach(column => {
                const cellValue = rowData[column.key] ?? ''; // Handle undefined values
                trInnerHTML += `<td>${this.escapeHTML(cellValue)}</td>`;
            });
            tbodyInnerHTML += `<tr>${trInnerHTML}</tr>`;
        });

        this.tbody.innerHTML = tbodyInnerHTML;
        this.table.appendChild(thead);
        this.table.appendChild(this.tbody);
        this.container.appendChild(this.table);
    }

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