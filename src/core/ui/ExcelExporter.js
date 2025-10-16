/**
 * A reusable utility class to export an HTML table to an Excel (.xls) file.
 */
export class ExcelExporter {
    /**
     * Converts and downloads an HTML table as an Excel file.
     * @param {HTMLElement} tableElement - The HTML <table> element to export.
     * @param {string} filename - The desired name for the downloaded file (e.g., "report.xls").
     * @param {string} sheetName - The name of the worksheet inside the Excel file.
     */
    export(tableElement, filename = 'export.xls', sheetName = 'Sheet1') {
        if (!tableElement || tableElement.tagName !== 'TABLE') {
            console.error("ExcelExporter.export requires a valid HTML <table> element.");
            return;
        }

        // 1. Clone the table to avoid modifying the original DOM element
        const clonedTable = tableElement.cloneNode(true);

        // 2. Apply styles to the cloned table for Excel rendering
        const thStyle = 'font-weight: bold; color: white; background-color: dodgerblue; text-align: center;';
        const tdThStyle = 'border: 1px solid black;'; // Style for both <td> and <th>

        // Apply styles to all <th> elements
        const thElements = clonedTable.querySelectorAll('th');
        thElements.forEach(th => {
            th.setAttribute('style', thStyle + tdThStyle);
        });

        // Apply styles to all <td> elements
        const tdElements = clonedTable.querySelectorAll('td');
        tdElements.forEach(td => {
            td.setAttribute('style', tdThStyle);
        });

        // 3. Create the Excel file template with the styled table
        const template = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:x="urn:schemas-microsoft-com:office:excel"
                  xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
                </head>
                <body>
                    <table>${clonedTable.innerHTML}</table>
                </body>
            </html>`;

        // 4. Create the Data URI
        const base64 = (s) => window.btoa(unescape(encodeURIComponent(s)));
        const uri = 'data:application/vnd.ms-excel;base64,';
        const finalUri = uri + base64(template);

        // 5. Trigger the download
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
}