"use strict";
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CarritoSchema = new Schema({
    producto: { type: Schema.ObjectId, ref: 'producto', required: true },
    cliente: { type: Schema.ObjectId, ref: 'cliente', required: true },
    cantidad: { type: Number, required: true },
    variedad: { type: String, required: true },
    createAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("carrito", CarritoSchema);
