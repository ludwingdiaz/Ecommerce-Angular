"use strict";

var Cupon = require("../models/cupon");

const registro_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let data = req.body;
            let reg = await Cupon.create(data);
            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const listar_cupones_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == "admin") {
            var filtro = req.params["filtro"];
            let reg = await Cupon.find({ codigo: new RegExp(filtro, 'i') });
            //popular para que nos muestre el nombre del admin

            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess 01" });
    }
};

const obtener_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            var id = req.params['id']
            try {
                //data.portada = portada_name;
                var reg = await Cupon.findById({ _id: id });
                res.status(200).send({ data: reg });
            } catch (error) {
                res.status(200).send({ data: undefined });
            }

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const actualizar_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let id = req.params['id'];
            let data = req.body;
            try {
                let reg = await Cupon.findByIdAndUpdate({ _id: id }, {
                    codigo: data.codigo,
                    tipo: data.tipo,
                    valor: data.valor,
                    limite: data.limite,
                });

                res.status(200).send({ data: reg });
            } catch (error) {
                res.status(200).send({ data: undefined });
            }

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const eliminar_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            var id = req.params['id'];
            try {
                var reg = await Cupon.findByIdAndRemove({ _id: id });
                res.status(200).send({ data: reg });
            } catch (error) {
                res.status(200).send({ data: undefined });
            }
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}
module.exports = {
    registro_cupon_admin, listar_cupones_admin,
    obtener_cupon_admin, actualizar_cupon_admin,
    eliminar_cupon_admin
}