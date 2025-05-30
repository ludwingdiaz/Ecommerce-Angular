"use strict";

var Admin = require("../models/admin");
var bcrypt = require("bcrypt-nodejs");
//Exportamos el token
var jwt = require("../middlewares/jwt");

const registroAdmin = async function (req, res) {
  var data = req.body;

  //Validar correos existentes
  var adminArrray = [];
  adminArrray = await Admin.find({ email: data.email });
  if (adminArrray.length == 0) {
    //Registro

    //Encryptar contraseya y registrar
    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          var reg = await Admin.create(data);
          res.status(200).send({ data: reg });
        } else {
          res.status(200).send({ Message: "ErrorServer", data: undefined });
        }
      });
    } else {
      res.status(200).send({ Message: "No hay contraseya", data: undefined });
    }
  } else {
    res.status(200).send({ Message: "El correo ya existe", data: undefined });
  }
};

const loginAdmin = async function (req, res) {
  var data = req.body;

  //Comprobar si el usuario existe
  var adminArrray = [];
  adminArrray = await Admin.find({ email: data.email });
  if (adminArrray.length == 0) {
    res.status(200).send({ Message: "El correo no existe", data: undefined });
  } else {
    //Si existe lo almacenados en el array en la pociocion 0
    let user = adminArrray[0];
    //Desencriptamos la contraseya para comparar
    bcrypt.compare(data.password, user.password, async function (error, check) {
      //si  las contraseyas no coinsiden me retornara el check
      if (check) {
        res.status(200).send({ data: user, token: jwt.createToken(user) });
      } else {
        res
          .status(200)
          .send({ Message: "La contraseya no coincide ", data: undefined });
      }
    });

    //validamos con la contraseya sea igual
  }
};

module.exports = { registroAdmin, loginAdmin };
