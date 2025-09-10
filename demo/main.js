// demo/main.js
import { Grid } from '../src/core/Grid.js';

const gridContainer = document.getElementById('grid-container');

// This is how a user will interact with the library!
const myGrid = new Grid(gridContainer, {
    dataSource: {
        mode: 'url',
        source: './data.json'
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
                    // Find the record *when the click occurs*
                    // const rowData = dataStore.getRecordById(keyFieldValue, keyField);
                    // // Now execute the original action with the correct row data
                    console.log(myGrid.config)
                    console.log(myGrid.store)
                    console.log('Edit action clicked for:', rowData);
                    myGrid.init()
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
});