"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const DventaSchema = new Schema({
    cliente: { type: Schema.ObjectId, ref: 'cliente', required: true },
    producto: { type: Schema.ObjectId, ref: 'producto', required: true },
    venta: { type: Schema.ObjectId, ref: 'venta', required: true },
    subtotal: { type: Number, required: true },
    variedad: { type: String, required: true },
    cantidad: { type: Number, required: true },
    createAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("dventa", DventaSchema);
