"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdminSchema = new Schema({
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  telefono: { type: String, required: true },
  rol: { type: String, required: true },
  dni: { type: String, required: true },
});

module.exports = mongoose.model("admin", AdminSchema);
