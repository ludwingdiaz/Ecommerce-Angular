"use strict";
require("dotenv").config();
const express = require("express");
var app = express();
app.use(express.json());
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
//var port = process.env.PORT || 4201;
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
  cors: { origin: '*' }
});

io.on('connection', function (socket) {
  socket.on('delete-carrito', function (data) {
    io.emit('new-carrito', data);
    console.log(data)
  });

  socket.on('add-carrito-add', function (data) {
    io.emit('new-carrito-add', data);
    console.log(data)
  });
})
const cliente_Route = require("./routes/cliente");
const admin_Route = require("./routes/admin");
const producto_Route = require("./routes/producto");
const cupon_Route = require("./routes/cupon");
const config_Route = require("./routes/config");
const carrito_Route = require("./routes/carrito");
const venta_Route = require("./routes/venta");
const dventa_Route = require("./routes/dventa");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

server.listen(3000, () => {
  console.log("Server is running at port");
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header("Allow", "GET, PUT, POST, DELETE, OPTIONS");
  next();
});

app.use("/api", cliente_Route);
app.use("/api", admin_Route);
app.use("/api", producto_Route);
app.use("/api", cupon_Route);
app.use("/api", config_Route);
app.use("/api", carrito_Route);
app.use("/api", venta_Route);
app.use("/api", dventa_Route);


module.exports = app;
