import { CssLogics } from "./utils/CssLogics.js";
import { formatDate } from "./utils/DateFunctions.js";

/**
 * Renderer is a utility class for rendering HTML tables (grids) into a specified container element.
 * It supports custom column rendering, action columns, and paging UI.
 *
 * @class
 */
export class Renderer {
  /**
   * Creates a new Renderer instance.
   * @param {HTMLElement|ShadowRoot} containerElement - The DOM element or ShadowRoot where the table will be rendered.
   * @throws {Error} If no container element is provided.
   */
  constructor(containerElement, config) {
    if (!containerElement) {
      throw new Error("Renderer requires a container element.");
    }
    this.container = containerElement; // This can be a ShadowRoot

    // ✅ Only run once per instance
    this._ensureFaFilterStyle();
    this._ensureResizerStyle();

    this.table = null;
    this.tbody = null;
    this.config = config;
  }

  /**
   * Renders the grid/table structure into the container.
   * Clears the container, builds the table, header, body, and appends it. Supports custom cell rendering and action columns.
   * @param {Array<Object>} data - The array of data objects to render.
   * @param {Object} config - The configuration object for the table (columns, style, actionColumn, customCSS, etc).
   * @param {Object} pagingState - The current paging state (currentPage, totalPages, etc).
   */
  render(data, pagingState) {
    // Clear the container (ShadowRoot or HTMLElement)
    this.container.innerHTML = "";

    // Inject custom CSS links before rendering content
    this._injectCustomStyles(this.config.customCSS);
    // Inject style rules
    this._injectStyleRules(this.config.styleRules);

    const { headerRows, leafColumns } = this._calculateHeaderStructure(
      this.config.columns
    );

    // ...
    this.table = document.createElement("table");
    const thead = document.createElement("thead");
    this.tbody = document.createElement("tbody");
    this.table.setAttribute(
      "class",
      "table table-bordered commonTable table-striped"
    );

    // ✅ ENFORCE FIXED LAYOUT
    this.table.style.tableLayout = "fixed";
    this.table.style.boxSizing = "border-box";

    if (this.config.style) {
      Object.assign(this.table.style, this.config.style);
    }

    // ✅ ADD <colgroup> TO MANAGE FIXED WIDTHS
    const colgroup = document.createElement("colgroup");

    // Add Action Column <col>
    if (this.config.actionColumn) {
      const col = document.createElement("col");
      if (this.config.actionColumn.width) {
        col.style.width = this.config.actionColumn.width;
      }
      colgroup.appendChild(col);
    }

    // Add Leaf Column <col> elements
    leafColumns.forEach((column) => {
      const col = document.createElement("col");
      if (column.width) {
        col.style.width = column.width;
      } else {
        // Optional: log a warning if a width isn't provided,
        // as it's critical for 'fixed' layout
        console.warn(
          `Grid: Column "${column.key}" should have a 'width' property for 'table-layout: fixed' to work reliably.`
        );
      }
      colgroup.appendChild(col);
    });

    this.table.appendChild(colgroup);
    // ...

    // This loop now builds the entire header structure first
    let maxCols = 0;
    headerRows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((header) => {
        const th = document.createElement("th");
        Object.assign(th.style, this.config.thStyle);
        th.style.boxSizing = "border-box";

        th.textContent = header.title;
        th.dataset.key = header.key;
        if (header.colspan > 1) th.colSpan = header.colspan;
        if (header.rowspan > 1) th.rowSpan = header.rowspan;

        if (this.config.filterData && header.colspan === 1) {
          th.innerHTML += `&nbsp;&nbsp;<i class="fa fa-filter filter-icon ${
            header.hasFilter ? " has-filter " : ""
          }" style="opacity:1 !important; visibility:visible !important; ${
            header.hasFilter ? "color: gray" : ""
          }" aria-hidden="true"></i>`;
        }

        // ✅ FIX: Only add resizer to leaf columns (which have colspan = 1)
        if (this.config.resizableColumns?.enabled && header.colspan === 1) {
          this._setupColumnResizing(th);
        }

        tr.appendChild(th);
      });
      thead.appendChild(tr);
      maxCols = Math.max(maxCols, row.length);
    });

    // ✅ NEW: Now that the header rows are built, add the Action column header
    if (this.config.actionColumn) {
      const actionTh = document.createElement("th");
      actionTh.textContent = this.config.actionColumn.title || "Actions";
      // Make it span all header rows
      actionTh.rowSpan = headerRows.length;

      // Find the first header row and add it
      const firstHeaderRow = thead.querySelector("tr");
      if (firstHeaderRow) {
        // Prepend to make it the first column, or use appendChild to make it the last
        firstHeaderRow.prepend(actionTh);
      }
    }

    let tbodyInnerHTML = "";
    data.forEach((rowData) => {
      let keyField = "";
      this.config.keyField.split(",").forEach((key) => (keyField += rowData[key]));

      let trInnerHTML = `<tr key="${keyField}">`; // Add key to the row

      if (this.config.actionColumn) {
        // Action menu button
        trInnerHTML += `<td><button type="button" class="action-trigger" style="background-color:none; border: none"><i class="fa fa-bars"></i></button></td>`;
      }

      // Use the flat list of leafColumns to ensure correct order and cell count
      leafColumns.forEach((column) => {
        let cellValue = rowData[column.key] ?? this.config.nullPlaceholder;

        // --- FINAL, ROBUST DATE FORMATTING LOGIC ---
        if (
          this.config.dateFormat &&
          column.datatype &&
          column.datatype.toLowerCase() === "date" &&
          cellValue
        ) {
          let dateCandidate = null;

          if (cellValue instanceof Date) {
            // Case 1: Value is already a Date object (most reliable)
            dateCandidate = cellValue;
          } else if (typeof cellValue === "string") {
            const valueString = cellValue.trim();

            // Case 2: Handle common JSON date format like "/Date(1234567890000)/"
            const match = valueString.match(/\/Date\((\d+)\)\//);

            if (match) {
              // Extract timestamp and create date
              dateCandidate = new Date(parseInt(match[1], 10));
            } else if (valueString !== "") {
              // Case 3: Standard string parsing (ISO, RFC, etc.)
              dateCandidate = new Date(valueString);
            }
          } else if (typeof cellValue === "number" && cellValue !== 0) {
            // Case 4: Handle numeric timestamps. Skip small numbers (like IDs)
            // by requiring a value greater than a small timestamp (e.g., 100 seconds after epoch)
            // If it is a timestamp, it will be a very large number.
            if (cellValue > 100000) {
              dateCandidate = new Date(cellValue);
            }
          }
          // console.log('Formatting date for column:', column.key, column, 'with value:', cellValue);
          cellValue = formatDate(dateCandidate, this.config.dateFormat);
        }
        // --- END FINAL, ROBUST DATE FORMATTING LOGIC ---

        if (
          column.datatype &&
          column.datatype.toLowerCase() === "date" &&
          this.config.dateFormat
        ) {
          const template = document.createElement("template");

          // Render or fallback to plain <td>
          const cellHTML = column.render
            ? column.render(cellValue, rowData)
            : `<td>${this.escapeHTML(cellValue)}</td>`;

          template.innerHTML = cellHTML.trim();

          const td = template.content.firstElementChild;

          if (td) {
            // Safely append Excel date formatting
            const existingStyle = td.getAttribute("style") || "";
            td.setAttribute(
              "style",
              `${existingStyle}; mso-number-format:'${this.config.dateFormat}';`
            );
            trInnerHTML += td.outerHTML;
          } else {
            // Fallback if render returned something invalid
            trInnerHTML += `<td style="mso-number-format:'${
              this.config.dateFormat
            }';">${this.escapeHTML(cellValue)}</td>`;
          }
        } else {
          // Non-date columns
          const cellHTML = column.render
            ? column.render(cellValue, rowData)
            : `<td>${this.escapeHTML(cellValue)}</td>`;
          trInnerHTML += cellHTML;
        }
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
    if (this.config.paging && this.config.paging.enabled) {
      this.renderPager(pagingState);
    }

    // Apply sticky headers and frozen columns after full layout render
    const hasStickyHeaders = this.config.thStyle?.position === "sticky";
    // Check if any leaf column or the action column is set to freeze
    const hasFrozenColumns =
      this.config.actionColumn?.freeze === true ||
      (leafColumns && leafColumns.some((c) => c.freeze === true));

    if (hasStickyHeaders || hasFrozenColumns) {
      window.requestAnimationFrame(() => {
        // ✅ Pass headerRows and leafColumns
        this._applyStickyStyles(this.table, leafColumns, headerRows);
      });

      // 👇 Recalculate stickies when table resizes
      if (!this._resizeObserver) {
        this._resizeObserver = new ResizeObserver(() => {
          // ✅ Pass headerRows and leafColumns
          this._applyStickyStyles(this.table, leafColumns, headerRows);
        });

        const thead = this.table.querySelector("thead");
        if (thead) {
          this._resizeObserver.observe(thead);
          // Optional: observe each header row for better precision
          Array.from(thead.rows).forEach((row) =>
            this._resizeObserver.observe(row)
          );
        }
      }
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
    const pagerContainer = document.createElement("div");
    pagerContainer.className = "grid-pager";
    const coords = this.container.getBoundingClientRect();
    pagerContainer.style.position = "absolute";
    pagerContainer.style.left = `${coords.x + 5}px`;
    pagerContainer.style.top = `${coords.y + coords.height + 5}px`;

    // Example: "Page 1 of 10" text
    const pageInfo = document.createElement("span");
    pageInfo.textContent = `Page ${pagingState.currentPage} of ${pagingState.totalPages}`;

    // Example: "Previous" button
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.dataset.page = pagingState.currentPage - 1;
    if (pagingState.currentPage === 1) {
      prevButton.disabled = true;
    }

    // Example: "Next" button
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
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
   * Performs a "Virtual DOM" style update.
   * It aligns new data with existing DOM rows using the keyField.
   * * @param {Array<Object>} newData - The full array of new data to display.
   * @param {Object} config - Grid configuration.
   */
  reconcile(newData) {
    if (!this.tbody) return; // Guard if render() hasn't been called yet

    const keyField = this.config.keyField;
    const leafColumns = this.currentLeafColumns || this._calculateHeaderStructure(this.config.columns).leafColumns;

    // 1. Map existing DOM rows by their Key for quick lookup
    const existingRows = new Map();
    Array.from(this.tbody.children).forEach(tr => {
      const key = tr.getAttribute('key');
      if (key) existingRows.set(key, tr);
    });

    // 2. Create a document fragment for any brand new rows (optimization)
    const fragment = document.createDocumentFragment();
    
    // Track keys we've processed to know what to delete later
    const processedKeys = new Set();

    newData.forEach((rowData, index) => {
        // Generate the unique key for this row data
        let rowKey = "";
        keyField.split(",").forEach((k) => (rowKey += rowData[k]));
        
        processedKeys.add(rowKey);

        // Generate the HTML for this row (New Content)
        const newHtmlContent = this._generateRowInnerHtml(rowData, leafColumns);

        if (existingRows.has(rowKey)) {
            // --- UPDATE EXISTING ---
            const tr = existingRows.get(rowKey);
            
            // Simple Diff: Only update DOM if the HTML string doesn't match.
            // This prevents losing input focus or selection if data hasn't effectively changed.
            if (tr.innerHTML !== newHtmlContent) {
                tr.innerHTML = newHtmlContent;
            }

            // Re-order handling: Ensure the row is at the correct physical index
            const currentRowAtIndex = this.tbody.children[index];
            if (currentRowAtIndex !== tr) {
                // If the row is not where it should be, move it.
                // insertBefore moves the element if it's already in the DOM.
                this.tbody.insertBefore(tr, currentRowAtIndex);
            }

        } else {
            // --- CREATE NEW ---
            const tr = document.createElement('tr');
            tr.setAttribute('key', rowKey);
            tr.innerHTML = newHtmlContent;
            
            // Insert at the specific index to maintain order
            if (index < this.tbody.children.length) {
                this.tbody.insertBefore(tr, this.tbody.children[index]);
            } else {
                this.tbody.appendChild(tr);
            }
        }
    });

    // 3. Cleanup: Remove rows that are no longer in the data
    existingRows.forEach((tr, key) => {
        if (!processedKeys.has(key)) {
            tr.remove();
        }
    });
  }

  /**
   * Helper: Generates just the inner HTML (tds) for a row.
   * Does NOT generate the <tr> tag itself, allowing us to reuse the existing TR.
   */
  _generateRowInnerHtml(rowData, leafColumns) {
    let html = "";
    
    if (this.config.actionColumn) {
        html += `<td><button type="button" class="action-trigger" style="background-color:none; border: none"><i class="fa fa-bars"></i></button></td>`;
    }

    leafColumns.forEach(column => {
        let cellValue = rowData[column.key] ?? this.config.nullPlaceholder;

        // --- FINAL, ROBUST DATE FORMATTING LOGIC ---
        if (
          this.config.dateFormat &&
          column.datatype &&
          column.datatype.toLowerCase() === "date" &&
          cellValue
        ) {
          let dateCandidate = null;

          if (cellValue instanceof Date) {
            // Case 1: Value is already a Date object (most reliable)
            dateCandidate = cellValue;
          } else if (typeof cellValue === "string") {
            const valueString = cellValue.trim();

            // Case 2: Handle common JSON date format like "/Date(1234567890000)/"
            const match = valueString.match(/\/Date\((\d+)\)\//);

            if (match) {
              // Extract timestamp and create date
              dateCandidate = new Date(parseInt(match[1], 10));
            } else if (valueString !== "") {
              // Case 3: Standard string parsing (ISO, RFC, etc.)
              dateCandidate = new Date(valueString);
            }
          } else if (typeof cellValue === "number" && cellValue !== 0) {
            // Case 4: Handle numeric timestamps. Skip small numbers (like IDs)
            // by requiring a value greater than a small timestamp (e.g., 100 seconds after epoch)
            // If it is a timestamp, it will be a very large number.
            if (cellValue > 100000) {
              dateCandidate = new Date(cellValue);
            }
          }
          // console.log('Formatting date for column:', column.key, column, 'with value:', cellValue);
          cellValue = formatDate(dateCandidate, this.config.dateFormat);
        }
        // --- END FINAL, ROBUST DATE FORMATTING LOGIC ---
        if (this.config.dateFormat && column.datatype?.toLowerCase() === 'date' && cellValue) {
             cellValue = formatDate(cellValue, this.config.dateFormat); // Assumed global or imported
        }

        const cellContent = column.render
            ? column.render(cellValue, rowData)
            : `<td>${this.escapeHTML(cellValue)}</td>`;
            
        html += cellContent;
    });

    return html;
  }

  showEditForm(rowData, editFormConfig) {
    // For simplicity, we'll implement only the 'inline' mode here
    if (editFormConfig.mode === "inline") {
      const tr = this.tbody.querySelector(
        `tr[key="${rowData[this.config.keyField]}"]`
      );
      if (!tr) return;
      const formRow = document.createElement("tr");
      const formCell = document.createElement("td");
      formCell.colSpan = tr.children.length;
      formCell.innerHTML = editFormConfig.HTML;
      formRow.appendChild(formCell);
      tr.insertAdjacentElement("afterend", formRow);
    }
    // 'popup' mode can be implemented as needed
    if (editFormConfig.mode === "popup") {
    }
  }

  /**
   * Parses nested column config and calculates rowspan, colspan, and level.
   * @param {Array<Object>} columns - The user-defined column array.
   * @returns {{ headerRows: Array<Array<Object>>, leafColumns: Array<Object> }}
   */
  _calculateHeaderStructure(columns) {
    const headerRows = [];
    const leafColumns = [];

    // ✅ MODIFIED: Added 'parentIsFrozen' parameter
    function traverse(column, level, parentIsFrozen = false) {
      if (!headerRows[level]) headerRows[level] = [];

      // ✅ A column is frozen if its parent is frozen, OR if it's set to freeze itself.
      const currentlyFrozen = parentIsFrozen || column.freeze === true;

      // clone the object to avoid mutating the original
      const header = { ...column, level, colspan: 1, rowspan: 1 };

      // ✅ Set the final freeze state on the header object
      header.freeze = currentlyFrozen;

      headerRows[level].push(header);

      if (column.children && column.children.length > 0) {
        header.colspan = 0;
        column.children.forEach((child) => {
          // ✅ Pass the new 'currentlyFrozen' state down to children
          traverse(child, level + 1, currentlyFrozen);
          const childHeader = headerRows[level + 1].find(
            (h) => h.key === child.key
          );
          header.colspan += childHeader ? childHeader.colspan : 1;
        });
      } else {
        // ✅ This leafColumn now has the correct propagated 'freeze' status
        leafColumns.push(header);
      }
    }

    // start traversal
    columns
      .sort((a, b) => a.index - b.index)
      .forEach((col) => traverse(col, 0));

    // determine total depth for rowspans
    const maxDepth = headerRows.length;
    headerRows.forEach((row, level) => {
      row.forEach((header) => {
        const hasChildren = header.children && header.children.length > 0;
        if (!hasChildren) {
          header.rowspan = maxDepth - level;
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
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Injects external CSS link tags into the container element (or ShadowRoot).
   * @param {Array<string>} cssHrefs - An array of URLs for the external stylesheets.
   * @private
   */
  _injectCustomStyles(cssHrefs) {
    if (Renderer._customStylesInjected) return; // prevent multiple adds
    Renderer._customStylesInjected = true;

    if (!Array.isArray(cssHrefs) || cssHrefs.length === 0) {
      cssHrefs = [];
    }

    // Always ensure Font Awesome loads
    const fontAwesomeURL =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
    if (!cssHrefs.includes(fontAwesomeURL)) {
      cssHrefs.unshift(fontAwesomeURL);
    }

    cssHrefs.forEach((href) => {
      // Determine where to append the link:
      // If container is a ShadowRoot → inject there
      // Else inject globally into <head>
      const target =
        this.container instanceof ShadowRoot ? this.container : document.head;

      // Avoid duplicates
      if (target.querySelector(`link[href="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;

      // Append where it’ll actually apply
      target.appendChild(link);
    });
  }

  /**
   * Applies sticky positioning for headers (top) and frozen columns (left).
   * This function calculates and applies 'top' offsets for header rows and
   * 'left' offsets for frozen columns by accumulating column widths
   * from the <colgroup>.
   *
   * @param {HTMLTableElement} table - The table element.
   * @param {Object} config - The grid configuration object.
   * @param {Array<Object>} leafColumns - The flat array of leaf column definitions.
   * @param {Array<Array<Object>>} headerRows - The nested array of header data objects.
   * @private
   */
  _applyStickyStyles(table, leafColumns, headerRows) {
    if (!table) return;

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return;

    const hasActionColumn = !!this.config.actionColumn;
    const isActionColumnFrozen = hasActionColumn && this.config.actionColumn.freeze === true;
    const hasFrozenLeafCols = leafColumns.some(c => c.freeze === true);

    // === 1. APPLY STICKY HEADERS (Top) ===
    if (this.config.thStyle?.position === "sticky") {
      requestAnimationFrame(() => {
        const rows = Array.from(thead.rows);
        const rowHeights = rows.map((row) => row.offsetHeight);

        rows.forEach((row, rowIndex) => {
          const topOffset = rowHeights
            .slice(0, rowIndex) // sum of heights of all rows above
            .reduce((a, b) => a + b, 0);

          Array.from(row.cells).forEach((th) => {
            th.style.position = "sticky";
            th.style.top = `${topOffset}px`;
            // ✅ Base z-index for scrolling headers is 90
            th.style.zIndex = 90 + rowIndex;

            const bg = getComputedStyle(th).backgroundColor;
            if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
              th.style.background = "#f5f5f5"; // Default sticky header bg
            }
          });
        });
      });
    }

    // === 2. APPLY FROZEN COLUMNS (Left) ===
    if (!isActionColumnFrozen && !hasFrozenLeafCols) {
      return; // No frozen columns, nothing to do.
    }

    requestAnimationFrame(() => {
      // ✅ FIX: Get widths from the <colgroup>, not the <thead>
      const colgroup = table.querySelector("colgroup");
      if (!colgroup) {
        console.error("Grid: Missing <colgroup> element, cannot apply frozen columns.");
        return;
      }
      // ✅ Get all <col> elements, which are the source of truth for width
      const cols = Array.from(colgroup.children);

      const columnLeftOffsets = {};
      let accumulatedLeftOffset = 0; // "sum of width till the last before current one"
      let domCellIndex = 0; // This will now track the <col> index

      // --- Measure Action Column ---
      if (hasActionColumn) {
        if (isActionColumnFrozen) {
          const col = cols[domCellIndex]; // Get the <col> element
          if (col) {
            // ✅ Set left for current column
            columnLeftOffsets[domCellIndex] = accumulatedLeftOffset; 
            // ✅ Add current col's width for the *next* column's calculation
            accumulatedLeftOffset += col.offsetWidth; 
          }
        }
        domCellIndex++; // Increment index for action column
      }

      // --- Measure Data Columns ---
      leafColumns.forEach((column) => {
        // We only care about leaf columns that are frozen
        if (column.freeze === true) {
          const col = cols[domCellIndex]; // Get the <col> element
          if (col) {
            // ✅ Set left for current column
            columnLeftOffsets[domCellIndex] = accumulatedLeftOffset;
            // ✅ Add current col's width for the *next* column's calculation
            accumulatedLeftOffset += col.offsetWidth;
          }
        }
        // Increment domCellIndex for *every* leaf column to stay in sync
        domCellIndex++;
      });
      
      // --- Apply styles to THEAD (handling nested headers) ---
      // (This logic remains the same, as it just applies the calculated offsets)
      Array.from(thead.rows).forEach((row, rowIndex) => {
        const headerDataRow = headerRows[rowIndex]; 
        let currentDomCellIndex = 0;

        if (hasActionColumn) {
          if (isActionColumnFrozen) {
            const cell = row.cells[currentDomCellIndex];
            const left = columnLeftOffsets[currentDomCellIndex];
            if (cell && left !== undefined) {
              this._applyFreezeStyle(cell, left, true);
            }
          }
          currentDomCellIndex++;
        }

        if (headerDataRow) {
            headerDataRow.forEach((header) => {
              if (header.freeze === true) {
                const cell = row.cells[currentDomCellIndex];
                const left = columnLeftOffsets[currentDomCellIndex]; 
                if (cell && left !== undefined) {
                  this._applyFreezeStyle(cell, left, true);
                }
              }
              currentDomCellIndex++;
            });
        }
      });

      // --- Apply styles to TBODY (simpler, 1-to-1 mapping) ---
      // (This logic also remains the same)
      Array.from(tbody.rows).forEach((row) => {
        Object.keys(columnLeftOffsets).forEach((cellIndex) => {
          const cell = row.cells[cellIndex];
          const left = columnLeftOffsets[cellIndex];
          if (cell && left !== undefined) {
            this._applyFreezeStyle(cell, left, false);
          }
        });
      });
    });
  }

  /**
   * Helper function to apply sticky/freeze styles to a cell.
   * @param {HTMLElement} cell - The TH or TD cell.
   * @param {number} left - The calculated left offset.
   * @param {boolean} isHeader - If true, applies header-level z-index.
   * @private
   */
  _applyFreezeStyle(cell, left, isHeader) {
    cell.style.position = "sticky";
    cell.style.left = `${left}px`;

    if (isHeader) {
      // ✅ Base z-index is 90+. Make frozen headers 20 higher.
      const baseZ = parseInt(cell.style.zIndex) || 90;
      cell.style.zIndex = baseZ + 20; // e.g., 110, 111
    } else {
      // ✅ Make frozen body cells 100 (higher than 90s, lower than 110s)
      cell.style.zIndex = 100;
    }

    // Ensure background is set
    const bg = getComputedStyle(cell).backgroundColor;
    if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
      cell.style.background = isHeader ? "#f5f5f5" : "#ffffff";
    }
  }

  _setupColumnResizing(th) {
    const resizer = document.createElement("div");
    resizer.className = "column-resizer";
    resizer.style.cssText = `
    width: 5px;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    cursor: col-resize;
    user-select: none;
    z-index: 10;
  `;

    th.style.position = "relative";
    th.appendChild(resizer);

    let startX, startWidth;
    let isResizing = false;
    let rafId = null;

    // === Utility: simple throttle via requestAnimationFrame ===
    const scheduleResize = (width) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        th.style.width = `${width}px`;
      });
    };

    const startResize = (e) => {
      startX = e.pageX;
      startWidth = th.offsetWidth;
      isResizing = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", stopResize);
    };

    const onMouseMove = (e) => {
      if (!isResizing) return;
      const delta = e.pageX - startX;
      const newWidth = startWidth + delta;

      if (
        newWidth >= this.config.resizableColumns.minWidth &&
        newWidth <= this.config.resizableColumns.maxWidth
      ) {
        scheduleResize(newWidth);
      }
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopResize);
      if (rafId) cancelAnimationFrame(rafId);
    };

    resizer.addEventListener("mousedown", startResize);
  }

  _ensureResizerStyle() {
    if (Renderer._resizerStyleApplied) return; // prevent multiple adds
    Renderer._resizerStyleApplied = true;

    const style = document.createElement("style");
    style.textContent = `
        .column-resizer:hover {
            background-color: #0000001a;
        }
        .column-resizer:active {
            background-color: #0000004d;
        }
    `;
    this.container.appendChild(style);
  }

  _ensureFaFilterStyle() {
    if (Renderer._faFilterStyleApplied) return; // prevent multiple adds
    Renderer._faFilterStyleApplied = true;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        /* Default filter icon (auto contrast) */
        .fa-filter:before {
            opacity: 1 !important;
            visibility: visible !important;
            color: white !important;
            transition: color 0.2s ease-in-out;
        }

        /* Active or filtered state */
        th .fa-filter.has-filter:before,
        th.has-filter .fa-filter:before,
        .fa-filter.active:before {
            color: gray !important;
        }

        /* Hover state */
        th .fa-filter:hover:before {
            color: #aaa !important;
        }
        
        /* Filter icon margin adjustment */
        .fa-filter {
            margin: 1px 5px 0px 10px;
        }
  `);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }

  _injectStyleRules(styleRules) {
    if (Renderer._styleRulesInjected) return; // prevent multiple adds
    Renderer._styleRulesInjected = true;

    const cssText = CssLogics.objectToCSS(styleRules);

    const styleTag = document.createElement("style");
    styleTag.textContent = cssText;
    document.head.appendChild(styleTag);
  }

  /**
   * Calculates relative luminance (per W3C spec) for an RGB color.
   * @param {string} color - CSS color string like 'rgb(45, 67, 89)' or 'rgba(45,67,89,1)'
   * @returns {number} luminance between 0 (dark) and 1 (light)
   */
  _calculateLuminance(color) {
    let r = 245,
      g = 245,
      b = 245; // fallback light gray

    const rgb_match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgb_match) {
      r = parseInt(rgb_match[1], 10) / 255;
      g = parseInt(rgb_match[2], 10) / 255;
      b = parseInt(rgb_match[3], 10) / 255;
    }

    // sRGB to linear
    const srgbToLinear = (c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);

    // Luminance formula
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  _loader() {
    const table = this.container.querySelector("table");
    if (table) {
      table.querySelector("tbody").innerHTML =
        '<tr><td colspan="100%" style="text-align:center; padding: 10px;">Loading data...</td></tr>';
    }
  }
}
