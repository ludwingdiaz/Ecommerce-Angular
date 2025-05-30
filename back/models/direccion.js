"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const DireccionSchema = new Schema({
    cliente: { type: Schema.ObjectId, ref: 'cliente', required: true },
    destinatario: { type: String, required: true },
    dni: { type: String, required: true },
    zip: { type: String, required: true },
    direccion: { type: String, required: true },
    pais: { type: String, required: true },
    region: { type: String, required: false },
    provincia: { type: String, required: false },
    distrito: { type: String, required: false },
    telefono: { type: String, required: true },
    principal: { type: Boolean, required: true },
    createAt: { type: Date, default: Date.now, require: true },
});

module.exports = mongoose.model("direccion", DireccionSchema);
