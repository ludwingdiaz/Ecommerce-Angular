"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const InventarioSchema = new Schema({
    producto: { type: Schema.ObjectId, ref: 'producto', required: true },
    cantidad: { type: Number, required: true },
    admin: { type: Schema.ObjectId, ref: 'admin', required: false },
    proveedor: { type: String, required: true },
    createAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("inventario", InventarioSchema);
