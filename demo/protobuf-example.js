// Example of how JAGL could support Protocol Buffers (protobuf)
// This demonstrates the concept - actual implementation would require protobuf.js or similar

/*
Proto Definition (grid_schema.proto):

syntax = "proto3";

package jagl;

message GridSchema {
  string version = 1;
  Metadata metadata = 2;
  DataSource data_source = 3;
  string key_field = 4;
  repeated Column columns = 5;
  ActionColumn action_column = 6;
  Sorting sorting = 7;
  Paging paging = 8;
  Style style = 9;
  bool add_serial_column = 10;
}

message Metadata {
  string title = 1;
  string description = 2;
  string created = 3;
  string author = 4;
}

message DataSource {
  string mode = 1;  // "url" or "json"
  string source = 2;
}

message Column {
  string key = 1;
  string title = 2;
  int32 index = 3;
  string renderer = 4;
  RendererOptions renderer_options = 5;
  repeated Column children = 6;
}

message RendererOptions {
  map<string, string> options = 1;
}

message ActionColumn {
  string title = 1;
  string key_field = 2;
  repeated Action actions = 3;
}

message Action {
  string label = 1;
  string class_name = 2;
  string handler = 3;
  string icon = 4;
}

message Sorting {
  string key = 1;
  string order = 2;
}

message Paging {
  bool enabled = 1;
  int32 page_size = 2;
}

message Style {
  map<string, string> properties = 1;
}
*/

// Example usage with protobuf (conceptual)
import { RendererRegistry, ActionRegistry } from '../src/core/Registries.js';
import { Grid } from '../src/core/Grid.js';
// import { GridSchema } from './generated/grid_schema_pb.js'; // Generated from protobuf

// Register renderers (same as JSON approach)
RendererRegistry.register('statusBadge', (value, rowData, options = {}) => {
    const color = value === 'Active' ? (options.activeColor || 'green') : (options.inactiveColor || 'red');
    return `<td><span style="color: ${color}; font-weight: bold;">${value}</span></td>`;
});

// Create protobuf schema (in practice, this would come from network/file)
function createProtobufSchema() {
    const schema = new GridSchema();
    schema.setVersion('1.0');
    
    const metadata = new GridSchema.Metadata();
    metadata.setTitle('Employee Grid');
    metadata.setDescription('Employee management grid');
    schema.setMetadata(metadata);
    
    const dataSource = new GridSchema.DataSource();
    dataSource.setMode('url');
    dataSource.setSource('./data.json');
    schema.setDataSource(dataSource);
    
    schema.setKeyField('id');
    
    // Add columns
    const snoColumn = new GridSchema.Column();
    snoColumn.setKey('sno');
    snoColumn.setTitle('S.No');
    snoColumn.setIndex(0);
    snoColumn.setRenderer('default');
    
    const statusColumn = new GridSchema.Column();
    statusColumn.setKey('status');
    statusColumn.setTitle('Status');
    statusColumn.setIndex(2);
    statusColumn.setRenderer('statusBadge');
    
    const rendererOptions = new GridSchema.RendererOptions();
    const optionsMap = rendererOptions.getOptionsMap();
    optionsMap.set('activeColor', 'green');
    optionsMap.set('inactiveColor', 'red');
    statusColumn.setRendererOptions(rendererOptions);
    
    schema.addColumns(snoColumn);
    schema.addColumns(statusColumn);
    
    return schema;
}

// Enhanced Grid class to support protobuf
export class EnhancedGrid extends Grid {
    constructor(containerElement, config = {}) {
        if (config.protobufSchema) {
            // Convert protobuf to internal format
            const convertedConfig = this.convertProtobufToConfig(config.protobufSchema);
            super(containerElement, convertedConfig);
        } else {
            super(containerElement, config);
        }
    }
    
    convertProtobufToConfig(protobufSchema) {
        const config = {};
        
        // Convert protobuf message to JavaScript object
        config.version = protobufSchema.getVersion();
        
        const dataSource = protobufSchema.getDataSource();
        if (dataSource) {
            config.dataSource = {
                mode: dataSource.getMode(),
                source: dataSource.getSource()
            };
        }
        
        config.keyField = protobufSchema.getKeyField();
        
        // Convert columns
        config.columns = protobufSchema.getColumnsList().map(column => {
            const col = {
                key: column.getKey(),
                title: column.getTitle(),
                index: column.getIndex(),
                renderer: column.getRenderer()
            };
            
            // Convert renderer options
            if (column.getRendererOptions()) {
                const optionsMap = column.getRendererOptions().getOptionsMap();
                col.rendererOptions = {};
                optionsMap.forEach((value, key) => {
                    col.rendererOptions[key] = value;
                });
            }
            
            // Convert children recursively
            if (column.getChildrenList().length > 0) {
                col.children = column.getChildrenList().map(child => 
                    this.convertColumnProtobufToConfig(child)
                );
            }
            
            return col;
        });
        
        // Convert action column
        const actionColumn = protobufSchema.getActionColumn();
        if (actionColumn) {
            config.actionColumn = {
                title: actionColumn.getTitle(),
                keyField: actionColumn.getKeyField(),
                actions: actionColumn.getActionsList().map(action => ({
                    label: action.getLabel(),
                    className: action.getClassName(),
                    handler: action.getHandler(),
                    icon: action.getIcon()
                }))
            };
        }
        
        // Convert other properties...
        
        return config;
    }
}

// Usage examples:

// Example 1: Load protobuf from binary data
async function loadGridFromProtobuf(binaryData) {
    const schema = GridSchema.deserializeBinary(binaryData);
    const grid = new EnhancedGrid(document.getElementById('container'), {
        protobufSchema: schema
    });
}

// Example 2: Create grid from protobuf object
function createGridFromProtobuf() {
    const schema = createProtobufSchema();
    const grid = new EnhancedGrid(document.getElementById('container'), {
        protobufSchema: schema
    });
}

// Example 3: Serialize grid configuration to protobuf
function serializeGridConfig(grid) {
    const schema = this.convertConfigToProtobuf(grid.config);
    const binaryData = schema.serializeBinary();
    
    // Save to file, send over network, etc.
    return binaryData;
}

/*
BENEFITS OF PROTOBUF APPROACH:

1. COMPACT BINARY FORMAT
   - Smaller payload size compared to JSON
   - Faster serialization/deserialization
   - Better for network transmission

2. STRONG TYPING
   - Schema is strongly typed
   - Compile-time validation
   - Better IDE support

3. BACKWARD/FORWARD COMPATIBILITY
   - Built-in versioning support
   - Fields can be added without breaking existing code
   - Better for evolving APIs

4. CROSS-LANGUAGE SUPPORT
   - Same schema can be used in different languages
   - Consistent data structures across services
   - Better for microservices architecture

5. VALIDATION
   - Required fields are enforced
   - Type checking at compile time
   - Enum validation

COMPARISON:

JSON APPROACH:
- Human readable
- Easy to debug
- Larger payload
- Runtime validation only

PROTOBUF APPROACH:
- Binary format (smaller)
- Compile-time validation
- Better for production systems
- Requires code generation

HYBRID APPROACH:
- Support both JSON and protobuf
- JSON for development/debugging
- Protobuf for production
- Same internal processing logic
*/

export { EnhancedGrid, createProtobufSchema };