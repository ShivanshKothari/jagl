// demo/main.js
import { Grid } from '../src/core/Grid.js';

const gridContainer = document.getElementById('grid-container');

// This is how a user will interact with your library!
const myGrid = new Grid(gridContainer, {
    dataSource: {
      mode: 'url',
      source: './data.json'
    },
    sorting: {
      key: 'sno',
      order: 'asc'
    },
 addSerialColumn: true,
});