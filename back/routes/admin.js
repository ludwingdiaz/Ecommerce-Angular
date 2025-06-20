"use strict";
var express = require("express");
var adminController = require("../controllers/adminController");

var api = express.Router();

api.post("/registroAdmin", adminController.registroAdmin);
api.post("/loginAdmin", adminController.loginAdmin);

module.exports = api;
