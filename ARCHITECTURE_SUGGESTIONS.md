# JAGL Architecture Suggestions: Document-Driven Grid Configuration

## Overview

This document provides suggestions for evolving JAGL toward a more document-driven architecture, similar to modern documentation systems where table configurations can be defined as JSON/protobuf objects and rendered using registered functions.

## Current Architecture Issues

### 1. Inline Render Functions
**Current approach:**
```javascript
{
    key: 'status',
    title: 'Status',
    render: (value) => {
        const color = value === 'Active' ? 'green' : 'red';
        return `<td><span style="color: ${color}; font-weight: bold;">${value}</span></td>`;
    }
}
```

**Issues:**
- Not serializable to JSON
- Difficult to version control
- Hard to reuse across different grids
- Tight coupling between config and logic

### 2. Monolithic Configuration
- All configuration happens in JavaScript
- No schema validation
- No template system for common patterns

## Suggested Architecture Improvements

### 1. Renderer Registry System

**Create a global renderer registry:**
```javascript
// New file: src/core/RendererRegistry.js
export class RendererRegistry {
    static renderers = new Map();
    
    static register(name, renderFunction) {
        this.renderers.set(name, renderFunction);
    }
    
    static get(name) {
        return this.renderers.get(name);
    }
    
    static getAll() {
        return Array.from(this.renderers.keys());
    }
}

// Built-in renderers
RendererRegistry.register('statusBadge', (value, rowData) => {
    const color = value === 'Active' ? 'green' : 'red';
    return `<td><span style="color: ${color}; font-weight: bold;">${value}</span></td>`;
});

RendererRegistry.register('email', (value) => {
    return `<td><a href="mailto:${value}">${value}</a></td>`;
});

RendererRegistry.register('currency', (value, rowData, options = {}) => {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: options.currency || 'USD'
    }).format(value);
    return `<td class="text-right">${formatted}</td>`;
});
```

### 2. JSON-Based Configuration Schema

**Schema-driven grid configuration:**
```json
{
  "version": "1.0",
  "metadata": {
    "title": "Employee Management Grid",
    "description": "Grid for managing employee data",
    "created": "2024-01-01",
    "template": "employee_grid"
  },
  "dataSource": {
    "mode": "url",
    "source": "./data.json"
  },
  "keyField": "id",
  "columns": [
    {
      "key": "sno",
      "title": "S.No",
      "index": 0,
      "renderer": "default"
    },
    {
      "key": "employeenamestatus",
      "title": "Employee Name & Status",
      "index": 1,
      "children": [
        {
          "key": "name",
          "title": "Employee Name",
          "index": 1,
          "renderer": "default"
        },
        {
          "key": "status",
          "title": "Status",
          "index": 2,
          "renderer": "statusBadge"
        }
      ]
    },
    {
      "key": "email",
      "title": "Email",
      "index": 3,
      "renderer": "email"
    },
    {
      "key": "salary",
      "title": "Salary",
      "index": 4,
      "renderer": "currency",
      "rendererOptions": {
        "currency": "USD"
      }
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
  "sorting": {
    "key": "sno",
    "order": "asc"
  },
  "paging": {
    "enabled": true,
    "pageSize": 10
  },
  "style": {
    "overflow": "scroll",
    "margin": 0
  }
}
```

### 3. Action Handler Registry

**Similar to renderers, create an action handler registry:**
```javascript
// New file: src/core/ActionRegistry.js
export class ActionRegistry {
    static handlers = new Map();
    
    static register(name, handlerFunction) {
        this.handlers.set(name, handlerFunction);
    }
    
    static get(name) {
        return this.handlers.get(name);
    }
}

// Register common actions
ActionRegistry.register('editEmployee', (rowData) => {
    console.log('Edit employee:', rowData);
    // Implementation here
});

ActionRegistry.register('deleteEmployee', (rowData) => {
    console.log('Delete employee:', rowData);
    // Implementation here
});
```

### 4. Template System

**Create reusable grid templates:**
```javascript
// New file: src/templates/GridTemplates.js
export const GridTemplates = {
    'employee_grid': {
        "defaultColumns": [
            {"key": "id", "title": "ID", "renderer": "default"},
            {"key": "name", "title": "Name", "renderer": "default"},
            {"key": "email", "title": "Email", "renderer": "email"},
            {"key": "status", "title": "Status", "renderer": "statusBadge"}
        ],
        "defaultActions": [
            {"label": "Edit", "handler": "edit"},
            {"label": "Delete", "handler": "delete"}
        ],
        "defaultStyle": {
            "overflow": "scroll",
            "margin": 0
        }
    },
    
    'financial_grid': {
        "defaultColumns": [
            {"key": "id", "title": "ID", "renderer": "default"},
            {"key": "amount", "title": "Amount", "renderer": "currency"},
            {"key": "date", "title": "Date", "renderer": "date"}
        ]
    }
};
```

### 5. Enhanced Grid Constructor

**Modified Grid class to support schema loading:**
```javascript
export class Grid {
    constructor(containerElement, config = {}) {
        // Support both old-style config and new schema
        if (typeof config === 'string') {
            // Load schema from URL or template name
            this.loadSchema(config).then(() => this.init());
        } else if (config.schema) {
            // Load from schema object
            this.config = this.processSchema(config.schema);
            this.init();
        } else {
            // Legacy mode - existing functionality
            this.config = config;
            this.init();
        }
    }
    
    async loadSchema(schemaSource) {
        if (GridTemplates[schemaSource]) {
            // Load from template
            this.config = this.processTemplate(schemaSource);
        } else if (schemaSource.startsWith('http')) {
            // Load from URL
            const response = await fetch(schemaSource);
            const schema = await response.json();
            this.config = this.processSchema(schema);
        } else {
            throw new Error(`Unknown schema source: ${schemaSource}`);
        }
    }
    
    processSchema(schema) {
        // Convert JSON schema to internal config format
        // Handle renderer lookups, template inheritance, etc.
        const config = { ...schema };
        
        // Process columns and replace renderer strings with actual functions
        this.processColumns(config.columns);
        
        // Process actions and replace handler strings with actual functions
        if (config.actionColumn) {
            this.processActions(config.actionColumn.actions);
        }
        
        return config;
    }
    
    processColumns(columns) {
        columns.forEach(column => {
            if (column.renderer && typeof column.renderer === 'string') {
                const renderFunction = RendererRegistry.get(column.renderer);
                if (renderFunction) {
                    column.render = (value, rowData) => {
                        return renderFunction(value, rowData, column.rendererOptions);
                    };
                }
            }
            
            if (column.children) {
                this.processColumns(column.children);
            }
        });
    }
    
    processActions(actions) {
        actions.forEach(action => {
            if (action.handler && typeof action.handler === 'string') {
                const handlerFunction = ActionRegistry.get(action.handler);
                if (handlerFunction) {
                    action.onClick = handlerFunction;
                }
            }
        });
    }
}
```

### 6. Schema Validation

**Add JSON schema validation:**
```javascript
// New file: src/core/SchemaValidator.js
export class SchemaValidator {
    static validateGridSchema(schema) {
        const errors = [];
        
        // Version check
        if (!schema.version) {
            errors.push('Schema version is required');
        }
        
        // Required fields
        if (!schema.keyField) {
            errors.push('keyField is required');
        }
        
        // Column validation
        if (!schema.columns || !Array.isArray(schema.columns)) {
            errors.push('columns must be an array');
        } else {
            schema.columns.forEach((column, index) => {
                if (!column.key) {
                    errors.push(`Column at index ${index} missing key`);
                }
                if (!column.title) {
                    errors.push(`Column at index ${index} missing title`);
                }
                if (column.renderer && !RendererRegistry.get(column.renderer)) {
                    errors.push(`Unknown renderer '${column.renderer}' in column '${column.key}'`);
                }
            });
        }
        
        return errors;
    }
}
```

## Usage Examples

### 1. Schema-Based Grid Creation
```javascript
// Load from JSON file
const grid = new Grid(document.getElementById('container'), {
    schema: await fetch('./employee-grid-schema.json').then(r => r.json())
});

// Load from template
const grid = new Grid(document.getElementById('container'), 'employee_grid');

// Load from URL
const grid = new Grid(document.getElementById('container'), 'https://api.example.com/grid-schemas/employees');
```

### 2. Custom Renderer Registration
```javascript
// Register custom renderers before creating grids
RendererRegistry.register('profileImage', (value, rowData) => {
    return `<td><img src="${value}" alt="${rowData.name}" style="width: 40px; height: 40px; border-radius: 50%;" /></td>`;
});

RendererRegistry.register('progressBar', (value, rowData, options = {}) => {
    const percentage = Math.min(100, Math.max(0, value));
    const color = options.color || '#007bff';
    return `
        <td>
            <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 20px; background: ${color}; transition: width 0.3s;"></div>
            </div>
            <small>${percentage}%</small>
        </td>
    `;
});
```

### 3. Schema-Driven Development Workflow
```javascript
// 1. Define schema in JSON file
// employee-grid.schema.json

// 2. Register custom renderers/handlers
RendererRegistry.register('myCustomRenderer', myFunction);
ActionRegistry.register('myCustomAction', myActionFunction);

// 3. Create grid from schema
const grid = new Grid(container, { schema: employeeSchema });

// 4. Schema can be version controlled, shared, and validated
```

## Benefits of This Approach

### 1. **Serializable Configuration**
- Grid configurations can be stored as JSON in databases
- Easy to transmit over APIs (JSON or protobuf)
- Version control friendly

### 2. **Reusability**
- Renderers can be shared across different grids
- Templates provide consistent grid patterns
- Action handlers are reusable

### 3. **Separation of Concerns**
- Schema defines structure
- Renderers define presentation logic
- Actions define behavior
- Data is completely separate

### 4. **Development Workflow**
- Designers can create schemas without JavaScript knowledge
- Developers register renderers once, use everywhere
- Easy A/B testing with different schemas

### 5. **Validation and Error Handling**
- Schema validation catches errors early
- Better debugging with structured configuration
- Migration support between schema versions

## Migration Strategy

### Phase 1: Backward Compatibility
- Add new classes alongside existing code
- Support both old and new configuration formats
- No breaking changes to existing API

### Phase 2: Enhanced Features
- Add schema loading from URLs/files
- Implement template system
- Add validation layer

### Phase 3: Optimization
- Deprecate old inline function approach
- Optimize renderer performance
- Add advanced schema features (inheritance, composition)

This approach transforms JAGL from a code-driven to a document-driven grid system, making it more flexible, maintainable, and suitable for various development workflows.