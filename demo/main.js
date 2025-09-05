// demo/main.js
import { Grid } from '../src/core/Grid.js';

const gridContainer = document.getElementById('grid-container');

// This is how a user will interact with the library!
const myGrid = new Grid(gridContainer, {
    dataSource: {
      mode: 'url',
      source: './data2.json'
    },
    sorting: {
      key: 'sno',
      order: 'asc'
    },
 addSerialColumn: true,
});