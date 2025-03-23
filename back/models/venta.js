"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const VentaSchema = new Schema({
    cliente: { type: Schema.ObjectId, ref: 'cliente', required: true },
    nventa:  {type: String, required: true },
    subtotal: { type: Number, required: true },
    envio_titulo: {type: String, required: true },
    envio_precio: { type: Number, required: true },
    transaccion: { type: String, required: true },
    cupon: { type: String, required: false },
    estado: { type: String, required: true },
    direccion: { type: Schema.ObjectId, ref: 'direccion', required: true },
    nota: { type: String, required: false },
    createdAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("venta", VentaSchema);
