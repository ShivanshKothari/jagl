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
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error("Renderer requires a container element.");
    }
    this.container = containerElement; // This can be a ShadowRoot
    this.table = null;
    this.tbody = null;
  }

  /**
   * Renders the grid/table structure into the container.
   * Clears the container, builds the table, header, body, and appends it. Supports custom cell rendering and action columns.
   * @param {Array<Object>} data - The array of data objects to render.
   * @param {Object} config - The configuration object for the table (columns, style, actionColumn, customCSS, etc).
   * @param {Object} pagingState - The current paging state (currentPage, totalPages, etc).
   */
  render(data, config, pagingState) {
    // Clear the container (ShadowRoot or HTMLElement)
    this.container.innerHTML = "";

    // Inject custom CSS links before rendering content
    this._injectCustomStyles(config.customCSS);
    // Ensure filter icon styles are applied
    this._ensure_fa_filter_style();
    // Ensure resizer styles are applied
    this._ensure_resizer_style();

    const { headerRows, leafColumns } = this._calculateHeaderStructure(
      config.columns
    );

    this.table = document.createElement("table");
    const thead = document.createElement("thead");
    this.tbody = document.createElement("tbody");
    // ⛔️ REMOVED: No longer creating a separate headerRow here
    // const headerRow = document.createElement('tr');
    this.table.setAttribute(
      "class",
      "table table-bordered commonTable table-striped"
    );

    if (config.style) {
      Object.assign(this.table.style, config.style);
    }

    // This loop now builds the entire header structure first
    let maxCols = 0;
    headerRows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((header) => {
        const th = document.createElement("th");
        Object.assign(th.style, config.thStyle);
        th.style.top = `${header.level * 28}px`;
        th.textContent = header.title;
        th.dataset.key = header.key;
        if (header.colspan > 1) th.colSpan = header.colspan;
        if (header.rowspan > 1) th.rowSpan = header.rowspan;
        if (config.filterData && header.colspan === 1) {
          th.innerHTML += `&nbsp;&nbsp;<i class="fa fa-filter filter-icon ${
            header.hasFilter ? " has-filter " : ""
          }" style="opacity:1 !important; visibility:visible !important; ${
            header.hasFilter ? "color: gray" : ""
          }" aria-hidden="true"></i>`;
        }

        if (config.resizableColumns?.enabled) {
          this._setupColumnResizing(th, config);
        }

        tr.appendChild(th);
      });
      thead.appendChild(tr);
      maxCols = Math.max(maxCols, row.length);
    });

    // ✅ NEW: Now that the header rows are built, add the Action column header
    if (config.actionColumn) {
      const actionTh = document.createElement("th");
      actionTh.textContent = config.actionColumn.title || "Actions";
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
      config.keyField.split(",").forEach((key) => (keyField += rowData[key]));

      let trInnerHTML = `<tr key="${keyField}">`; // Add key to the row

      if (config.actionColumn) {
        // Action menu button
        trInnerHTML += `<td><button type="button" class="action-trigger" style="background-color:none; border: none"><i class="fa fa-bars"></i></button></td>`;
      }

      // Use the flat list of leafColumns to ensure correct order and cell count
      leafColumns.forEach((column) => {
        let cellValue = rowData[column.key] ?? "";

        // --- FINAL, ROBUST DATE FORMATTING LOGIC ---
        if (config.dateFormat && cellValue) {
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

          // Final check: Only format if we successfully created a VALID date object
          if (dateCandidate && !isNaN(dateCandidate.getTime())) {
            cellValue = formatDate(dateCandidate, config.dateFormat);
          }
        }
        // --- END FINAL, ROBUST DATE FORMATTING LOGIC ---

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

    // Apply sticky headers after full layout render
    if (config.thStyle?.position === "sticky") {
      window.requestAnimationFrame(() => this._applyStickyHeaders(this.table));
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

    function traverse(column, level) {
      if (!headerRows[level]) headerRows[level] = [];

      // clone the object to avoid mutating the original
      const header = { ...column, level, colspan: 1, rowspan: 1 };
      headerRows[level].push(header);

      if (column.children && column.children.length > 0) {
        header.colspan = 0;
        column.children.forEach((child) => {
          traverse(child, level + 1);
          const childHeader = headerRows[level + 1].find(
            (h) => h.key === child.key
          );
          header.colspan += childHeader ? childHeader.colspan : 1;
        });
      } else {
        leafColumns.push(header); // store with level as well
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

  _applyStickyHeaders(table) {
    if (!table) return;
    const thead = table.querySelector("thead");
    if (!thead) return;

    let cumulativeTop = 0;
    const rows = Array.from(thead.rows);

    rows.forEach((row, level) => {
      const height = row.offsetHeight;
      Array.from(row.cells).forEach((th) => {
        th.style.position = "sticky";
        th.style.top = `${cumulativeTop}px`;
        th.style.zIndex = 100 + level;
        // Check computed style, not just inline style
        const computedBg = getComputedStyle(th).backgroundColor;
        if (
          !computedBg ||
          computedBg === "rgba(0, 0, 0, 0)" || // fully transparent
          computedBg === "transparent"
        ) {
          th.style.background = "#f5f5f5";
        }
      });
      cumulativeTop += height;
    });
  }

  _setupColumnResizing(th, config) {
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
        `;

    th.style.position = "relative";
    th.appendChild(resizer);

    let startX, startWidth;

    const startResize = (e) => {
      startX = e.pageX;
      startWidth = th.offsetWidth;
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);
    };

    const resize = (e) => {
      const width = startWidth + (e.pageX - startX);
      if (
        width >= config.resizableColumns.minWidth &&
        width <= config.resizableColumns.maxWidth
      ) {
        th.style.width = `${width}px`;
      }
    };

    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    resizer.addEventListener("mousedown", startResize);
  }

  _ensure_resizer_style() {
    const style = document.createElement('style');
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

  _ensure_fa_filter_style() {
    // Check if our sheet is already attached
    const already_attached = document.adoptedStyleSheets.some((sheet) => {
      try {
        return (
          sheet.cssRules.length &&
          [...sheet.cssRules].some(
            (rule) => rule.selectorText === ".fa-filter:before"
          )
        );
      } catch {
        return false;
      }
    });
    if (already_attached) return;

    // --- Detect base header background ---
    const th = document.querySelector("th");
    const bg = th ? getComputedStyle(th).backgroundColor : "#f5f5f5";

    // --- Convert RGB(A) to luminance ---
    const luminance = this._calculate_luminance(bg);
    const default_color = luminance < 0.5 ? "white" : "#444"; // auto contrast

    const style_sheet = new CSSStyleSheet();

    style_sheet.replaceSync(`
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
    `);

    // Attach globally
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, style_sheet];
  }

  /**
   * Calculates relative luminance (per W3C spec) for an RGB color.
   * @param {string} color - CSS color string like 'rgb(45, 67, 89)' or 'rgba(45,67,89,1)'
   * @returns {number} luminance between 0 (dark) and 1 (light)
   */
  _calculate_luminance(color) {
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
    const srgb_to_linear = (c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    const R = srgb_to_linear(r);
    const G = srgb_to_linear(g);
    const B = srgb_to_linear(b);

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
