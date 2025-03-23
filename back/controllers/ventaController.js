"use strict";
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../middlewares/jwt");
const Venta = require("../models/venta");
const Dventa = require("../models/dventa");
const Producto = require("../models/producto");
const Carrito = require("../models/carrito");
const stripe = require("stripe")("sk_test_51Mk4kXCLIarqTSG4yKZ9Ji4NipgJb2oRf8f9dxEhNPCjq0I0uJVJs2RNp6ihRPOxOToe19qb3VSnbmX6MLUV59Rv004RCdHQFx");

const registro_compra_cliente = async function (req, res) {
    if (req.user) {
        var data = req.body;
        var detalles = data.detalles;

        let venta_last = await Venta.find().sort({ createdAt: -1 });
        var serie;
        var correlativo;
        var n_venta;
        if (venta_last.length == 0) {
            serie = '001';
            correlativo = '000001'
            n_venta = serie + '-' + correlativo;
        } else {
            var last_nventa = venta_last[0].nventa;
            var arr_nventa = last_nventa.split('-');

            if (arr_nventa[1] != '999999') {
                var new_correlativo = zfill(parseInt(arr_nventa[1]) + 1, 6);
                n_venta = arr_nventa[0] + '-' + new_correlativo;
            } else if (arr_nventa[1] == '999999') {
                var new_serie = zfill(parseInt(arr_nventa[0]) + 1, 3);
                n_venta = new_serie[0] + '-000001';
            }
        }

        data.nventa = n_venta;
        data.estado = 'Procesando';
        console.log(data)

        let venta = await Venta.create(data);

        detalles.forEach(async element => {
            element.venta = venta._id;
            await Dventa.create(element);

            let element_producto = await Producto.findById({ _id: element.producto });
            let new_stock = element_producto.stock - element.cantidad;

            await Producto.findByIdAndUpdate({ _id: element.producto }, {
                stock: new_stock
            });

            //Limpiar carrito
            await Carrito.deleteMany({ cliente: data.cliente })
        });
        res.status(200).send({ venta: venta });
    } else {
        res.status(500).send({ message: 'NoAccess' })
    }
}

const createPaymentIntent = async function (req, res) {
    if (!req.user) {
        return res.status(403).send({ message: "NoAccess" });
    }

    const { amount, currency } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // En centavos
            currency: currency,
            payment_method_types: ["card"],
        });
        res.status(200).send({ client_secret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Error creando PaymentIntent:", error);
        res.status(500).send({ error: error.message });
    }
};


function zfill(number, width) {
    var numberOutput = Math.abs(number);
    var length = number.toString().length;
    var zero = '0';

    if (width <= length) {
        if (number < 0) {
            return ('-' + numberOutput.toString());
        } else {
            return numberOutput.toString();
        }
    } else {
        if (number < 0) {
            return ('-' + (zero.repeat(width - length)) + numberOutput.toString());
        } else {
            return ((zero.repeat(width - length)) + numberOutput.toString());
        }
    }
}

module.exports = { registro_compra_cliente, createPaymentIntent, zfill };
