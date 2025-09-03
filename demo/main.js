import Grid from "../src/index.js";

const gridContainer = document.getElementById("grid-container");

const options = {
  dataSource: "./data.json",
  gridConfig: {}
};

console.log("Initializing grid...");
const myGrid = new Grid(gridContainer, options);
