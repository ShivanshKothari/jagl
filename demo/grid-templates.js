// Grid Templates - Pre-defined, reusable grid configurations
// This demonstrates how common grid patterns can be templatized

export const GridTemplates = {
    // Basic employee management grid
    'employee_basic': {
        metadata: {
            title: 'Employee Grid',
            description: 'Basic employee listing with common fields'
        },
        columns: [
            { key: 'id', title: 'ID', renderer: 'default', index: 0 },
            { key: 'name', title: 'Name', renderer: 'default', index: 1 },
            { key: 'email', title: 'Email', renderer: 'email', index: 2 },
            { key: 'status', title: 'Status', renderer: 'statusBadge', index: 3 }
        ],
        actions: [
            { label: 'Edit', handler: 'edit', className: 'btn-primary' },
            { label: 'Delete', handler: 'delete', className: 'btn-danger' }
        ],
        paging: { enabled: true, pageSize: 10 },
        sorting: { key: 'name', order: 'asc' }
    },

    // Financial/accounting grid with currency fields
    'financial': {
        metadata: {
            title: 'Financial Data Grid',
            description: 'Grid for displaying financial transactions'
        },
        columns: [
            { key: 'id', title: 'Transaction ID', renderer: 'default', index: 0 },
            { key: 'date', title: 'Date', renderer: 'date', index: 1 },
            { key: 'amount', title: 'Amount', renderer: 'currency', index: 2, rendererOptions: { currency: 'USD' } },
            { key: 'category', title: 'Category', renderer: 'badge', index: 3 },
            { key: 'status', title: 'Status', renderer: 'statusBadge', index: 4 }
        ],
        actions: [
            { label: 'View Details', handler: 'viewDetails', className: 'btn-info' },
            { label: 'Edit', handler: 'edit', className: 'btn-primary' }
        ],
        paging: { enabled: true, pageSize: 20 },
        sorting: { key: 'date', order: 'desc' }
    },

    // Product catalog grid with images
    'product_catalog': {
        metadata: {
            title: 'Product Catalog',
            description: 'Grid for displaying product information'
        },
        columns: [
            { key: 'image', title: 'Image', renderer: 'productImage', index: 0 },
            { key: 'name', title: 'Product Name', renderer: 'productName', index: 1 },
            { key: 'price', title: 'Price', renderer: 'currency', index: 2, rendererOptions: { currency: 'USD' } },
            { key: 'stock', title: 'Stock', renderer: 'stockLevel', index: 3 },
            { key: 'rating', title: 'Rating', renderer: 'starRating', index: 4 }
        ],
        actions: [
            { label: 'Edit Product', handler: 'editProduct', className: 'btn-primary' },
            { label: 'View Analytics', handler: 'viewAnalytics', className: 'btn-info' },
            { label: 'Delete', handler: 'deleteProduct', className: 'btn-danger' }
        ],
        paging: { enabled: true, pageSize: 12 },
        sorting: { key: 'name', order: 'asc' }
    },

    // User management with hierarchical roles
    'user_management': {
        metadata: {
            title: 'User Management',
            description: 'Grid for managing user accounts and permissions'
        },
        columns: [
            { key: 'avatar', title: 'Avatar', renderer: 'avatar', index: 0 },
            { 
                key: 'userinfo', 
                title: 'User Information', 
                index: 1,
                children: [
                    { key: 'name', title: 'Name', renderer: 'default', index: 1 },
                    { key: 'email', title: 'Email', renderer: 'email', index: 2 }
                ]
            },
            { key: 'role', title: 'Role', renderer: 'roleBadge', index: 3 },
            { key: 'lastLogin', title: 'Last Login', renderer: 'relativeTime', index: 4 },
            { key: 'status', title: 'Status', renderer: 'userStatus', index: 5 }
        ],
        actions: [
            { label: 'Edit Permissions', handler: 'editPermissions', className: 'btn-primary' },
            { label: 'Reset Password', handler: 'resetPassword', className: 'btn-warning' },
            { label: 'Deactivate', handler: 'deactivateUser', className: 'btn-danger' }
        ],
        paging: { enabled: true, pageSize: 15 },
        sorting: { key: 'name', order: 'asc' }
    },

    // Analytics dashboard with charts
    'analytics': {
        metadata: {
            title: 'Analytics Dashboard',
            description: 'Grid with embedded analytics and charts'
        },
        columns: [
            { key: 'metric', title: 'Metric', renderer: 'default', index: 0 },
            { key: 'current', title: 'Current', renderer: 'metricValue', index: 1 },
            { key: 'previous', title: 'Previous', renderer: 'metricValue', index: 2 },
            { key: 'change', title: 'Change', renderer: 'percentageChange', index: 3 },
            { key: 'trend', title: 'Trend', renderer: 'miniChart', index: 4 }
        ],
        actions: [
            { label: 'View Details', handler: 'viewMetricDetails', className: 'btn-info' },
            { label: 'Export Data', handler: 'exportMetric', className: 'btn-secondary' }
        ],
        paging: { enabled: false },
        sorting: { key: 'metric', order: 'asc' }
    }
};

// Template composition utilities
export class TemplateComposer {
    /**
     * Merge multiple templates together
     */
    static compose(...templateNames) {
        const templates = templateNames.map(name => GridTemplates[name]).filter(Boolean);
        return this.deepMerge({}, ...templates);
    }

    /**
     * Extend a template with custom configuration
     */
    static extend(templateName, customConfig) {
        const template = GridTemplates[templateName];
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }
        return this.deepMerge({}, template, customConfig);
    }

    /**
     * Create a new template by inheriting from an existing one
     */
    static inherit(baseTemplateName, newTemplateName, overrides = {}) {
        const baseTemplate = GridTemplates[baseTemplateName];
        if (!baseTemplate) {
            throw new Error(`Base template '${baseTemplateName}' not found`);
        }
        
        GridTemplates[newTemplateName] = this.deepMerge({}, baseTemplate, overrides);
        return GridTemplates[newTemplateName];
    }

    static deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.deepMerge(target, ...sources);
    }

    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
}

// Usage examples:

// 1. Use a pre-defined template
const employeeGrid = new Grid(container, { template: 'employee_basic' });

// 2. Extend a template with custom configuration
const customEmployeeGrid = new Grid(container, {
    template: TemplateComposer.extend('employee_basic', {
        columns: [
            ...GridTemplates.employee_basic.columns,
            { key: 'department', title: 'Department', renderer: 'default', index: 4 }
        ],
        paging: { enabled: true, pageSize: 25 }
    })
});

// 3. Create a new template by inheriting
TemplateComposer.inherit('employee_basic', 'employee_extended', {
    columns: [
        { key: 'id', title: 'Employee ID', renderer: 'default', index: 0 },
        { key: 'name', title: 'Full Name', renderer: 'default', index: 1 },
        { key: 'email', title: 'Email Address', renderer: 'email', index: 2 },
        { key: 'department', title: 'Department', renderer: 'departmentBadge', index: 3 },
        { key: 'position', title: 'Position', renderer: 'default', index: 4 },
        { key: 'salary', title: 'Salary', renderer: 'currency', index: 5, rendererOptions: { currency: 'USD' } },
        { key: 'status', title: 'Status', renderer: 'statusBadge', index: 6 }
    ]
});

const extendedEmployeeGrid = new Grid(container, { template: 'employee_extended' });

// 4. Compose multiple templates (for complex scenarios)
const compositeTemplate = TemplateComposer.compose('employee_basic', 'analytics');

/*
BENEFITS OF TEMPLATE SYSTEM:

1. RAPID DEVELOPMENT
   - Common grid patterns pre-configured
   - No need to redefine standard columns
   - Consistent UI patterns across application

2. REUSABILITY
   - Templates can be shared across projects
   - Standard patterns reduce development time
   - Consistent user experience

3. MAINTAINABILITY
   - Changes to templates affect all grids using them
   - Centralized configuration management
   - Easy to update styling/behavior globally

4. EXTENSIBILITY
   - Templates can be extended and customized
   - Inheritance allows for variations
   - Composition enables complex scenarios

5. BEST PRACTICES
   - Templates encode best practices
   - Proper column ordering and sizing
   - Appropriate renderers for data types

TEMPLATE HIERARCHY EXAMPLE:

base_template
├── employee_basic (inherits from base)
│   ├── employee_extended (inherits from employee_basic)
│   └── employee_minimal (inherits from employee_basic)
├── financial (inherits from base)
│   ├── financial_detailed (inherits from financial)
│   └── financial_summary (inherits from financial)
└── product_catalog (inherits from base)
    ├── product_minimal (inherits from product_catalog)
    └── product_detailed (inherits from product_catalog)

This creates a hierarchy where common patterns are shared and specialized templates build on top of them.
*/