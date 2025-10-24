/**
 * Renderer is a utility class for rendering HTML tables (grids) into a specified container element.
 * It supports custom column rendering, action columns, and paging UI.
 *
 * @class
 */
export class Renderer {
    /**
     * Creates a new Renderer instance.
     * @param {HTMLElement} containerElement - The DOM element where the table will be rendered.
     * @throws {Error} If no container element is provided.
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
     * Renders the grid/table structure into the container.
     * Clears the container, builds the table, header, body, and appends it. Supports custom cell rendering and action columns.
     * @param {Array<Object>} data - The array of data objects to render.
     * @param {Object} config - The configuration object for the table (columns, style, actionColumn, etc).
     * @param {Object} pagingState - The current paging state (currentPage, totalPages, etc).
     */
    render(data, config, pagingState) {
        this.container.innerHTML = '';

    const { headerRows, leafColumns } = this._calculateHeaderStructure(config.columns);

    this.table = document.createElement('table');
    const thead = document.createElement('thead');
    this.tbody = document.createElement('tbody');
    // ⛔️ REMOVED: No longer creating a separate headerRow here
    // const headerRow = document.createElement('tr'); 
    this.table.setAttribute("class", "table table-bordered commonTable table-striped");

    if (config.style) {
        Object.assign(this.table.style, config.style);
    }
    
    // ⛔️ REMOVED: Logic to add action column to a separate row is gone from here

    // This loop now builds the entire header structure first
    let maxCols = 0;
    headerRows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header.title;
            th.dataset.key = header.key;
            if (header.colspan > 1) th.colSpan = header.colspan;
            if (header.rowspan > 1) th.rowSpan = header.rowspan;
            if (config.filterData && header.colspan === 1) {
                th.innerHTML += `&nbsp;&nbsp;<i class="fa fa-filter filter-icon" style="${header.hasFilter ? 'color: gray' : ''}" aria-hidden="true"></i>`
            }
            tr.appendChild(th);
        });
        thead.appendChild(tr);
        maxCols = Math.max(maxCols, row.length);
    });

    // ✅ NEW: Now that the header rows are built, add the Action column header
    if (config.actionColumn) {
        const actionTh = document.createElement('th');
        actionTh.textContent = config.actionColumn.title || 'Actions';
        // Make it span all header rows
        actionTh.rowSpan = headerRows.length; 

        // Find the first header row and add it
        const firstHeaderRow = thead.querySelector('tr');
        if (firstHeaderRow) {
            // Prepend to make it the first column, or use appendChild to make it the last
            firstHeaderRow.prepend(actionTh); 
        }
    }

        let tbodyInnerHTML = '';
        data.forEach(rowData => {
            let keyField = '';
            config.keyField.split(',').forEach(key => keyField += rowData[key]);

            let trInnerHTML = `<tr key="${keyField}">`; // Add key to the row

            if (config.actionColumn) {
                // Action menu button
                trInnerHTML += `<td><button type="button" class="action-trigger" style="background-color:none; border: none"><i class="fa fa-bars"></i></button></td>`;
            }

            // Use the flat list of leafColumns to ensure correct order and cell count
            leafColumns.forEach(column => {
                const cellValue = rowData[column.key] ?? '';
                const cellHTML = column.render
                    ? column.render(cellValue, rowData)
                    : `<td>${this.escapeHTML(cellValue)}</td>`;
                trInnerHTML += cellHTML;
            });
            
            trInnerHTML += `</tr>`;
            tbodyInnerHTML += trInnerHTML;
        });

        if (!data || data.length === 0) {
            tbodyInnerHTML = `<td colspan="${maxCols}">No Data Available</td>`;

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

    /**
     * Renders a pager UI component below the container element, allowing navigation between pages.
     *
     * @param {Object} pagingState - The current paging state.
     * @param {number} pagingState.currentPage - The current active page number (1-based).
     * @param {number} pagingState.totalPages - The total number of available pages.
     *
     * @returns {void}
     */
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

    showEditForm(rowData, editFormConfig) {
        // For simplicity, we'll implement only the 'inline' mode here
        if (editFormConfig.mode === 'inline') {
            const tr = this.tbody.querySelector(`tr[key="${rowData[this.config.keyField]}"]`);
            if (!tr) return;
            const formRow = document.createElement('tr');
            const formCell = document.createElement('td');
            formCell.colSpan = tr.children.length;
            formCell.innerHTML = editFormConfig.HTML;
            formRow.appendChild(formCell);
            tr.insertAdjacentElement('afterend', formRow);
        }
        // 'popup' mode can be implemented as needed
        if (editFormConfig.mode === 'popup') {
            
        }
    }

    /**
     * Parses the nested column config and calculates rowspan and colspan for the header.
     * @param {Array<Object>} columns The user-defined columns array.
     * @returns {Array<Array<Object>>} An array of rows, where each row is an array of header objects.
     */
    _calculateHeaderStructure(columns) {
        const headerRows = [];
        const leafColumns = []; // To store the final, flat list of columns for the body

        function traverse(column, level) {
            if (!headerRows[level]) {
                headerRows[level] = [];
            }

            const header = {
                ...column
            };

            header.colspan = 1;
            header.rowspan = 1;
            
            headerRows[level].push(header);

            if (column.children && column.children.length > 0) {
                header.colspan = 0; // Colspan will be the sum of children's spans
                column.children.forEach(child => {
                    traverse(child, level + 1);
                    // The parent's colspan is the sum of its direct children's colspans
                    const childHeader = headerRows[level + 1].find(h => h.key === child.key);
                    header.colspan += childHeader ? childHeader.colspan : 1;
                });
            } else {
                // This is a "leaf" column, it will have a data cell in the body
                leafColumns.push(column);
            }
        }

        columns.sort((a, b) => a.index - b.index).forEach(col => traverse(col, 0));

        // Adjust rowspans for cells that don't have children
        const maxDepth = headerRows.length;
        headerRows.forEach(row => {
            row.forEach(header => {
                // If a header has no children, it should span all the way down
                const hasChildren = columns.find(c => c.key === header.key)?.children?.length > 0;
                if (!hasChildren) {
                    header.rowspan = maxDepth - headerRows.indexOf(row);
                }
            });
        });

        return { headerRows, leafColumns };
    }


    /**
     * Escapes HTML characters in a string to prevent XSS attacks.
     * Replaces characters like <, >, &, ", and ' with their HTML entities. If input is not a string, returns as is.
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