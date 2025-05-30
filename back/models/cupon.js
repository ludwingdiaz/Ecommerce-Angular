"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const CuponSchema = new Schema({
    codigo: { type: String, required: true },
    tipo: { type: String, required: true },//Porcentaje o precio fijo
    valor: { type: Number, required: true },
    limite: { type: Number, required: true },
    createAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("cupon", CuponSchema);
