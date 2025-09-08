// Example of how the demo could be transformed using the suggested architecture

// 1. Register custom renderers (would be in a separate file)
import { RendererRegistry } from '../src/core/RendererRegistry.js';
import { ActionRegistry } from '../src/core/ActionRegistry.js';
import { Grid } from '../src/core/Grid.js';

// Register built-in renderers
RendererRegistry.register('default', (value) => {
    return `<td>${value || ''}</td>`;
});

RendererRegistry.register('statusBadge', (value, rowData, options = {}) => {
    const activeColor = options.activeColor || 'green';
    const inactiveColor = options.inactiveColor || 'red';
    const fontWeight = options.fontWeight || 'bold';
    const color = value === 'Active' ? activeColor : inactiveColor;
    return `<td><span style="color: ${color}; font-weight: ${fontWeight};">${value}</span></td>`;
});

RendererRegistry.register('email', (value) => {
    if (!value) return '<td></td>';
    return `<td><a href="mailto:${value}" style="color: #007bff;">${value}</a></td>`;
});

// Register action handlers
ActionRegistry.register('editEmployee', (rowData) => {
    console.log('Edit action clicked for:', rowData);
    alert(`Editing employee: ${rowData.name}`);
});

ActionRegistry.register('deleteEmployee', (rowData) => {
    console.log('Delete action clicked for:', rowData);
    if (confirm(`Are you sure you want to delete ${rowData.name}?`)) {
        alert(`Deleted employee: ${rowData.name}`);
    }
});

// 2. Create grid using schema (NEW APPROACH)
const gridContainer = document.getElementById('grid-container');

// Option A: Load from JSON schema file
fetch('./employee-grid.schema.json')
    .then(response => response.json())
    .then(schema => {
        const myGrid = new Grid(gridContainer, { schema });
    });

// Option B: Use schema object directly
const gridSchema = {
    "version": "1.0",
    "dataSource": {
        "mode": "url",
        "source": "./data.json"
    },
    "keyField": "id",
    "columns": [
        { "key": "sno", "title": "S.No", "index": 0, "renderer": "default" },
        {
            "key": "employeenamestatus", 
            "title": "Employee Name & Status", 
            "index": 1, 
            "children": [
                { "key": "name", "title": "Employee Name", "index": 1, "renderer": "default" },
                { 
                    "key": "status", 
                    "title": "Status", 
                    "index": 2, 
                    "renderer": "statusBadge",
                    "rendererOptions": {
                        "activeColor": "green",
                        "inactiveColor": "red",
                        "fontWeight": "bold"
                    }
                }
            ]
        }
    ],
    "actionColumn": {
        "title": "Action",
        "keyField": "id",
        "actions": [
            {
                "label": "Edit",
                "className": "btn-edit",
                "handler": "editEmployee"
            },
            {
                "label": "Delete",
                "className": "btn-delete", 
                "handler": "deleteEmployee"
            }
        ]
    },
    "sorting": { "key": "sno", "order": "asc" },
    "addSerialColumn": true
};

const myGrid = new Grid(gridContainer, { schema: gridSchema });

// Option C: Load from template (would require template system)
// const myGrid = new Grid(gridContainer, 'employee_template');

/* 
BENEFITS OF THIS APPROACH:

1. SERIALIZABLE CONFIGURATION
   - The entire grid config is now JSON
   - Can be stored in databases, transmitted over APIs
   - Easy to version control and diff

2. REUSABLE RENDERERS
   - statusBadge renderer can be used in any grid
   - email renderer handles all email columns consistently
   - Renderers are tested once, used everywhere

3. DECLARATIVE APPROACH
   - Grid structure is described, not programmed
   - Non-developers can modify schemas
   - A/B testing different layouts is trivial

4. SEPARATION OF CONCERNS
   - Schema defines WHAT to render
   - Renderers define HOW to render
   - Actions define behavior
   - Data is completely separate

5. VALIDATION & ERROR HANDLING
   - JSON schemas can be validated
   - Unknown renderers are caught early
   - Better error messages for configuration issues

COMPARISON:

OLD APPROACH (Current):
- Inline functions in JavaScript
- Hard to serialize/store
- Difficult to reuse across grids
- Tight coupling

NEW APPROACH (Suggested):
- JSON schema with string references
- Fully serializable
- High reusability
- Clean separation of concerns

MIGRATION PATH:
- Both approaches can coexist
- Existing code continues to work
- New features use schema approach
- Gradual migration over time
*/