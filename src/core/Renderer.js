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
    render(data, config, pagingState) {
        this.container.innerHTML = '';


        this.table = document.createElement('table');
        const thead = document.createElement('thead');
        this.tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        this.table.setAttribute("class", "table table-bordered commonTable table-striped");

        if (config.style) {
            Object.assign(this.table.style, config.style);
        }
        // Add action column header if actionColumn config is provided
        if (config.actionColumn) {
        const th = document.createElement('th');
        th.textContent = config.actionColumn.title || 'Actions';
        headerRow.appendChild(th);
    }

        const finalColumns = config.columns.sort((a, b) => a.index - b.index)
        finalColumns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.title; // Title/caption
            th.dataset.key = column.key;   // Key/fieldname

            th.style.padding = '5px 10px';
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        let tbodyInnerHTML = '';
        data.forEach(rowData => {
            let keyField = '';
            config.keyField.split(',').forEach(key => keyField += rowData[key]);

            let trInnerHTML = `<tr key="${keyField}">`; // Add a data-id to the row

            if (config.actionColumn) {
                // You can customize this button with an icon, e.g., '...'
                trInnerHTML += `<td><button class="action-trigger" style="background-color:none; border: none"><i class="fa fa-bars"></i></button></td>`;
            }
            // Render normal cells
            finalColumns.forEach(column => {
                const cellValue = rowData[column.key] ?? '';

                // --- THIS IS THE KEY CHANGE ---
                // If a custom render function exists, use it. Otherwise, use the default.
                const cellContent = column.render
                    ? column.render(cellValue, rowData)
                    : this.escapeHTML(cellValue);
                trInnerHTML += `<td>${cellContent}</td>`;
            });

            trInnerHTML += `</tr>`;
            tbodyInnerHTML += trInnerHTML;

        });

        if (!data || data.length === 0) {
            tbodyInnerHTML = `<td colspan="${finalColumns.length}">No Data Available</td>`;

        }

        this.tbody.innerHTML = tbodyInnerHTML;
        this.table.appendChild(thead);
        this.table.appendChild(this.tbody);
        this.container.appendChild(this.table);

        // After rendering the table, render the pager UI
        if (config.paging && config.paging.enabled) {
            this.renderPager(pagingState);
        }
    }

    renderPager(pagingState) {
        const pagerContainer = document.createElement('div');
        pagerContainer.className = 'grid-pager';
        const coords = this.container.getBoundingClientRect();
        pagerContainer.style.position = 'absolute';
        pagerContainer.style.left = `${coords.x + 5}px`;
        pagerContainer.style.top = `${coords.y + coords.height + 5}px`;

        // Example: "Page 1 of 10" text
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${pagingState.currentPage} of ${pagingState.totalPages}`;

        // Example: "Previous" button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.dataset.page = pagingState.currentPage - 1;
        if (pagingState.currentPage === 1) {
            prevButton.disabled = true;
        }

        // Example: "Next" button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.dataset.page = pagingState.currentPage + 1;
        if (pagingState.currentPage === pagingState.totalPages) {
            nextButton.disabled = true;
        }

        pagerContainer.appendChild(prevButton);
        pagerContainer.appendChild(pageInfo);
        pagerContainer.appendChild(nextButton);

        this.container.appendChild(pagerContainer);
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