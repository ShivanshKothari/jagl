// demo/main.js
import { Grid } from '../src/core/Grid.js';

const gridContainer = document.getElementById('grid-container');

// This is how a user will interact with the library!
const myGrid = new Grid(gridContainer, {
    dataSource: {
        mode: 'url',
        source: './data2.json'
    },
    keyField: 'id',
    columns: [
        { key: 'sno', title: 'S.No', index: 0 },
        {key: 'employeenamestatus', title: 'Employee Name & Status', index: 1, children: [{ key: 'name', title: 'Employee Name', index: 1 },
        {
            key: 'status',
            title: 'Status',
            index: 2,
            // ✅ The new render function
            render: (value) => {
                const color = value === 'Active' ? 'green' : 'red';
                return `<td><span style="color: ${color}; font-weight: bold;">${value}</span></td>`;
            }
        }]}
        
    ],
    actionColumn: {
        title: 'Action',
        keyField: 'id',
        actions: [
            {
                label: 'Edit',
                className: 'btn-edit',
                onClick: (rowData) => {
                    myGrid.startEdit(rowData);
                }
            },
            {
                label: 'Delete',
                className: 'btn-delete',
                onClick: (rowData) => {
                    // Find the record *when the click occurs*
                    // const rowData = dataStore.getRecordById(keyFieldValue, keyField);
                    // // Now execute the original action with the correct row data
                    console.log('Edit action clicked for:', rowData);
                    myGrid.init()
                }
            }
        ]
    },
    sorting: {
        key: 'sno',
        order: 'asc'
    },
    addSerialColumn: true,
    editForm: {
        HTML: `<label for="name">Name:</label>
        <input type="text" id="name" name="name" required>
        <br><br>
        <label for="status">Status:</label>
        <select id="status" name="status" required>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          </select>
        <br><br>
        <button type="submit">Save</button>
        <button type="button" id="cancel-btn" onclick="myGrid.endEdit()">Cancel</button>`,
        mode: 'inline' // 'inline' | 'popup'
    },
    paging: {
                enabled: false
            }
});


const exportButton = document.getElementById('export-btn');
exportButton.addEventListener('click', () => {
    // Call the new public method on your grid instance
    myGrid.exportToExcel('VesselReport.xls');
});