// demo/main.js
import { Grid } from '../src/core/Grid.js';

const gridContainer = document.getElementById('grid-container');

// This is how a user will interact with the library!
const myGrid = new Grid(gridContainer, {
    dataSource: {
      mode: 'url',
      source: './data2.json'
    },
    columns: [
    {
        "key": "sno",
        "title": "sno"
    },
    {
        "key": "SNo",
        "title": "SNo"
    },
    {
        "key": "VesselName",
        "title": "VesselName"
    },
    {
        "key": "EventDate",
        "title": "EventDate"
    },
    {
        "key": "VesselID",
        "title": "VesselID"
    },
    {
        "key": "VoyageID",
        "title": "VoyageID"
    },
    {
        "key": "RecordID",
        "title": "RecordID"
    },
    {
        "key": "EventName",
        "title": "EventName"
    },
    {
        "key": "IFOPort",
        "title": "IFOPort"
    },
    {
        "key": "VLSFOPort",
        "title": "VLSFOPort"
    },
    {
        "key": "ULSMGOPort",
        "title": "ULSMGOPort"
    },
    {
        "key": "IFO_Cons",
        "title": "IFO_Cons"
    },
    {
        "key": "VLSFO_Cons",
        "title": "VLSFO_Cons"
    },
    {
        "key": "ULSFO_Cons",
        "title": "ULSFO_Cons"
    },
    {
        "key": "MDO_Cons",
        "title": "MDO_Cons"
    },
    {
        "key": "ULSMGO_Cons",
        "title": "ULSMGO_Cons"
    },
    {
        "key": "VLSMGO_Cons",
        "title": "VLSMGO_Cons"
    },
    {
        "key": "MEOH_Cons",
        "title": "MEOH_Cons"
    },
    {
        "key": "LNG_Cons",
        "title": "LNG_Cons"
    },
    
    {
        "key": "CargoLoaded",
        "title": "CargoLoaded"
    },
    {
        "key": "CargoDischarged",
        "title": "CargoDischarged"
    }
],
    sorting: {
      key: 'sno',
      order: 'asc'
    },
 addSerialColumn: true,
});