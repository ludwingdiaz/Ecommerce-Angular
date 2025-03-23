"use strict";

var Producto = require("../models/producto");
var Inventario = require("../models/inventario");
var fs = require('fs');
var path = require('path');

const registro_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let data = req.body;
            var img_path = req.files.portada.path;
            var name = img_path.split('\\');
            var portada_name = name[2];

            data.slug = data.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            data.portada = portada_name;
            let reg = await Producto.create(data);

            let inventario = await Inventario.create({
                admin: req.user.sub,
                cantidad: data.stock,
                proveedor: 'Primer registro',
                producto: reg._id

            });

            res.status(200).send({ data: reg, inventario: inventario });

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const listar_productos_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == "admin") {
            var filtro = req.params["filtro"];
            let reg = await Producto.find({ titulo: new RegExp(filtro, 'i') });
            res.status(200).send({ data: reg });

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess 01" });
    }
};

const obtener_portada = async function (req, res) {
    var img = req.params['img'];
    console.log(img)
    fs.stat('./uploads/productos/' + img, function (err) {
        if (!err) {
            let path_img = './uploads/productos/' + img;
            res.status(200).sendFile(path.resolve(path_img))
        } else {
            let path_img = './uploads/default.jpg';
            res.status(200).sendFile(path.resolve(path_img))
        }
    })
}

const obtener_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == "admin") {
            var id = req.params['id'];
            try {
                var reg = await Producto.findById({ _id: id });
                res.status(200).send({ data: reg });
            } catch (error) {
                res.status(200).send({ data: undefined });
            }
        } else {
            res.status(200).send({ data: reg });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
};

const actualizar_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let id = req.params['id']
            let data = req.body;

            if (req.files) {
                //SI HAY IMG
                var img_path = req.files.portada.path;
                var name = img_path.split('\\');
                var portada_name = name[2];
                //data.portada = portada_name;
                let reg = await Producto.findByIdAndUpdate({ _id: id }, {
                    titulo: data.titulo,
                    stock: data.stock,
                    precio: data.precio,
                    categoria: data.categoria,
                    descripcion: data.descripcion,
                    portada: portada_name
                });

                fs.stat('./uploads/productos/' + reg.portada, function (err) {
                    if (!err) {
                        fs.unlink('./uploads/productos/' + reg.portada, (err) => {
                            if (err) throw err;
                        });
                    }
                });

                res.status(200).send({ data: reg });
            } else {
                //SI NO HAYY
                let reg = await Producto.findByIdAndUpdate({ _id: id }, {
                    titulo: data.titulo,
                    stock: data.stock,
                    precio: data.precio,
                    categoria: data.categoria,
                    descripcion: data.descripcion,
                    contenido: data.contenido,
                });
                res.status(200).send({ data: reg });
            }

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const eliminar_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            var id = req.params['id'];
            try {
                /*fs.stat('./uploads/productos/' + img, function (err) {
                    if (!err) {
                        fs.unlink('./uploads/productos/' + img, (err) => {
                            if (err) throw err;
                        });
                    }
                });*/
                var reg = await Producto.findByIdAndRemove({ _id: id });
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

const listar_inventario_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == "admin") {
            var id = req.params["id"];
            let reg = await Inventario.find({ producto: id }).populate('admin').sort({ createAt: -1 });
            //popular para que nos muestre el nombre del admin

            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess 01" });
    }
};

const eliminar_inventario_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == "admin") {
            //obtener id del inventario
            var id = req.params["id"];
            //Eliminar inventario
            let reg = await Inventario.findByIdAndRemove({ _id: id });
            //Obtener el registro del producto
            let prod = await Producto.findById({ _id: reg.producto });
            //Calcular el nuevo stock
            let nuevo_stock = parseInt(prod.stock) - parseInt(reg.cantidad);
            //Actualizar del nmuevo stock al producto
            let producto = await Producto.findByIdAndUpdate({ _id: reg.producto }, {
                stock: nuevo_stock
            });
            res.status(200).send({ data: producto });
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess 01" });
    }
};

const registro_inventario_producto_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let data = req.body;
            let reg = await Inventario.create(data);
            //Obtener el registro del producto
            let prod = await Producto.findById({ _id: reg.producto });
            //Calcular el nuevo stock
            let nuevo_stock = parseInt(prod.stock) + parseInt(reg.cantidad);
            //Actualizar del nmuevo stock al producto
            let producto = await Producto.findByIdAndUpdate({ _id: reg.producto }, {
                stock: nuevo_stock
            });

            res.status(200).send({ data: reg });

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const actualizar_producto_variedades_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let id = req.params['id']
            let data = req.body;
            let reg = await Producto.findByIdAndUpdate({ _id: id }, {
                titulo_variedad: data.titulo_variedad,
                variedades: data.variedades,
            });
            res.status(200).send({ data: reg });

        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const agregar_imagen_galeria_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let id = req.params['id']
            let data = req.body;
            if (req.files) {
                //SI HAY IMG
                var img_path = req.files.imagen.path;
                var name = img_path.split('\\');
                var imagen_name = name[2];
                //data.portada = portada_name;
                let reg = await Producto.findByIdAndUpdate({ _id: id }, {
                    $push: {
                        galeria: {
                            imagen_name,
                            _id: data._id
                        }
                    }
                });
                res.status(200).send({ data: reg });
            }
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}

const eliminar_imagen_galeria_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            var id = req.params['id'];
            let data = req.body;
            try {
                let reg = await Producto.findByIdAndUpdate({ _id: id }, {
                    $pull: {
                        galeria: {
                            _id: data._id
                        }
                    }
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

//Publicos
const listar_productos_publico = async function (req, res) {
    try {
        var filtro = req.params["filtro"];
        let reg = await Producto.find({ titulo: new RegExp(filtro, 'i') });
        res.status(200).send({ data: reg });
    } catch (error) {
        res.status(500).send({ message: "NoAccess 01" });
    }
};

const obtener_productos_slug_publico = async function (req, res) {
    var slug = req.params['slug'];
    try {
        var reg = await Producto.findOne({ slug: slug });
        res.status(200).send({ data: reg });
    } catch (error) {
        res.status(200).send({ data: undefined });
    }

};

const listar_productos_recomendados_publico = async function (req, res) {
    try {
        var categoria = req.params["categoria"];
        let reg = await Producto.find({ categoria: categoria }).sort({ createAt: -1 }).limit(8);
        res.status(200).send({ data: reg });
    } catch (error) {
        res.status(500).send({ message: "NoAccess 01" });
    }
};


module.exports = {
    registro_producto_admin, listar_productos_admin, obtener_portada,
    obtener_producto_admin, actualizar_producto_admin,
    eliminar_producto_admin, listar_inventario_producto_admin,
    eliminar_inventario_producto_admin, registro_inventario_producto_admin,
    actualizar_producto_variedades_admin, agregar_imagen_galeria_admin,
    eliminar_imagen_galeria_admin, listar_productos_publico,
    obtener_productos_slug_publico, listar_productos_recomendados_publico
}