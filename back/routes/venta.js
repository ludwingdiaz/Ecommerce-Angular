"use strict";
var express = require("express");
var ventaController = require("../controllers/ventaController");

var api = express.Router();
var auth = require("../middlewares/authenticate");

api.post("/registro_compra_cliente", auth.auth, ventaController.registro_compra_cliente);
api.post("/create-payment-intent", auth.auth, ventaController.createPaymentIntent); // Nueva ruta

module.exports = api;