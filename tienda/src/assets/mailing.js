//handlebars nodemailer nodemailer-smtp-transport ejs

var fs = require('fs');
var handlebars = require('handlebars');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');

//OBTENER ACCESOS DE CUENTA CORREO EMISOR

/*
1. Verificacion en dos pasos: https://www.google.com/landing/2step/
2. Acceso y Seguridad / Permitir el acceso de aplicaciones menos seguras
3. Autorizacion: https://security.google.com/settings/security/apppasswords
*/

var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
    user: 'faustinoludwin@gmail.com',
    pass: 'pxxlwguauzqbpfkm'
    }
}));

//cliente _id fecha data subtotal

readHTMLFile(process.cwd() + '/mail.html', (err, html)=>{

    let rest_html = ejs.render(html, {data: data});

    var template = handlebars.compile(rest_html);
    var htmlToSend = template({op:true});

    var mailOptions = {
        from: 'faustinoludwin@gmail.com',
        to: data_inscripcion.estudiante.email,
        subject: 'Gracias por tu compra, Mi Tienda',
        html: htmlToSend
    };
    res.status(200).send({data:true});
    transporter.sendMail(mailOptions, function(error, info){
        if (!error) {
            console.log('Email sent: ' + info.response);
        }
    });

});
