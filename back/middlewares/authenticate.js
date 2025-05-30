"use strict";
const jwt = require("jwt-simple");
const moment = require("moment");
const secret = "diegoLoco";

exports.auth = function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send({ message: "NoHeadersError" });
  }

  let token = req.headers.authorization.replace(/['"]+/g, "");
  const segment = token.split(".");
  if (segment.length !== 3) {
    return res.status(403).send({ message: "InvalidToken" });
  }

  try {
    const payload = jwt.decode(token, secret);
    if (payload.exp <= moment().unix()) {
      return res.status(403).send({ message: "ExpiredToken" });
    }
    req.user = payload;
    next();
  } catch (error) {
    console.error("Error decodificando token:", error.message);
    return res.status(403).send({ message: "InvalidToken 01" });
  }
};