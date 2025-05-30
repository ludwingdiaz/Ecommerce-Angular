"use stric";
//Configuracion token para asignar a un Usuario

//Decoficar tokens
const jwt = require("jwt-simple");
const moment = require("moment");
//contraseya para genrar el token y encriptar los datos del
const secret = "diegoLoco";

exports.createToken = function (user) {
  var payload = {
    sub: user._id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    email: user.email,
    role: user.rol,
    //Fecha en el que se creo este token\
    iat: moment().unix(),
    //fecha de expiracion del token
    exp: moment().add(7, "days").unix(),
  };

  return jwt.encode(payload, secret);
};
