import { CssLogics } from "../utils/CssLogics.js";

export class ExcelExporter {
  /**
   * Converts and downloads an HTML table as an Excel file.
   * @param {HTMLElement} tableElement - The HTML <table> element to export.
   * @param {string} filename - The desired name for the downloaded file.
   * @param {string} sheetName - The name of the worksheet inside the Excel file.
   * @param {Object} [styleRules={}] - Optional styleRules from Renderer to apply.
   */
  export(tableElement, filename = "export.xls", sheetName = "Sheet1", styleRules = {}) {
    if (!tableElement || tableElement.tagName !== "TABLE") {
      console.error("ExcelExporter.export requires a valid HTML <table> element.");
      return;
    }

    // 1️⃣ Clone the table so we don’t touch the original
    const clonedTable = tableElement.cloneNode(true);

    // 2️⃣ Apply renderer styleRules inline for Excel compatibility
    this._applyStyleRulesInline(clonedTable, styleRules);

    // 3️⃣ Merge computed styles (font, bg, borders, alignment)
    this._applyComputedStyles(clonedTable, tableElement);

    // 4️⃣ Build the Excel HTML document
    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <style>
            table, th, td { border-collapse: collapse; border: 1px solid #000; }
          </style>
        </head>
        <body>
          <table>${clonedTable.innerHTML}</table>
        </body>
      </html>
    `;

    // 5️⃣ Encode and trigger download
    const base64 = (s) => window.btoa(unescape(encodeURIComponent(s)));
    const uri = "data:application/vnd.ms-excel;base64,";
    const finalUri = uri + base64(template);

    this._download(finalUri, filename);
  }

  _download(uri, filename) {
    const link = document.createElement("a");
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Applies styleRules (from Renderer) as inline styles for Excel export.
   * Example: styleRules = { "td": { textAlign: "center" }, "th": { backgroundColor: "#092e48" } }
   */
  _applyStyleRulesInline(table, styleRules = {}) {
    Object.entries(styleRules).forEach(([selector, rules]) => {
      table.querySelectorAll(selector).forEach((el) => {
        Object.entries(rules).forEach(([prop, value]) => {
          el.style[CssLogics.camel] = value;
        });
      });
    });
  }

  /**
   * Copies computed styles from the DOM table (Renderer) to the cloned table.
   * Ensures Excel sees inline CSS for font, alignment, background, borders, etc.
   */
  _applyComputedStyles(table, sourceTable) {
    const sourceCells = sourceTable.querySelectorAll("th, td");
    const targetCells = table.querySelectorAll("th, td");

    sourceCells.forEach((src, i) => {
      const target = targetCells[i];
      if (!target) return;

      const computed = window.getComputedStyle(src);
      const keys = [
        "fontFamily", "fontSize", "color", "backgroundColor",
        "textAlign", "verticalAlign", "fontWeight", "border", "padding"
      ];

      keys.forEach((key) => {
        target.style[key] = computed[key];
      });
    });
  }

}
