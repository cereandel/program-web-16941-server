const express = require("express");
const cors = require("cors");
const env = require("../utils/enviroment");
const path = require("path");
const app = express();

app.set('port', env.PORT);
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(cors({
    "origin": "*",
    "methods": "GET,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "credentials": true
}));


module.exports = app;