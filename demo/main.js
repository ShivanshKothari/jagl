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
        { key: 'name', title: 'Employee Name', index: 1 },
        {
            key: 'status',
            title: 'Status',
            index: 2,
            // ✅ The new render function
            render: (value) => {
                const color = value === 'Active' ? 'green' : 'red';
                return `<span style="color: ${color}; font-weight: bold;">${value}</span>`;
            }
        }
    ],
    actionColumn: {
        title: 'Action',
        keyField: 'id',
        actions: [
            {
                label: 'Edit',
                className: 'btn-edit',
                onClick: (keyField) => {
                    // Find the record *when the click occurs*
                    const rowData = this.store.getRecordById(keyField, this.config.keyField);
                    // Now execute the original action with the correct row data
                    console.log('Edit action clicked for:', rowData);
                }
            },
            {
                label: 'Delete',
                className: 'btn-delete',
                onClick: (keyField) => {
                    // Find the record *when the click occurs*
                    const rowData = this.store.getRecordById(keyField, this.config.keyField);
                    // Now execute the original action with the correct row data
                    action.onClick(rowData);
                    console.log('Delete action clicked for:', rowData);
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