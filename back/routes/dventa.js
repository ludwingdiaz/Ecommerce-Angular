"use strict";
var express = require("express");
var dventaController = require("../controllers/dventaController");

var api = express.Router();
var auth = require("../middlewares/authenticate");


module.exports = api;