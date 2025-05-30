import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { GLOBAL } from 'src/app/services/GLOBAL';
declare var $;
import { io } from "socket.io-client";
import { GuestService } from 'src/app/services/guest.service';
declare var iziToast;

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  public token;
  public id;
  public user: any = undefined;
  public user_lc: any = undefined;
  public config_global: any = {};
  public op_cart = false;

  public carrito_arr: Array<any> = [];
  public url;
  public subtotal = 0;
  public socket = io('http://localhost:3000');
  public descuento_activo: any = undefined;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
    private _guestService: GuestService
  ) {
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');
    this.url = GLOBAL.url;

    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }
    )

    if (this.token) {
      this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
        response => {
          this.user = response.data;
          localStorage.setItem('user_data', JSON.stringify(this.user));
          if (localStorage.getItem('user_data')) {
            this.user_lc = JSON.parse(localStorage.getItem('user_data'));

            this.obtener_carrito();
          } else {
            this.user_lc = undefined;
          }
        },
        error => {
          this.user = undefined;
        }
      );
    }
  }

  obtener_carrito() {
    this._clienteService.obtener_carrito_cliente(this.user_lc._id, this.token).subscribe(
      response => {
        this.carrito_arr = response.data;
        this.calcular_carrito();
      }
    );
  }

  ngOnInit(): void {
    this.socket.on('new-carrito', function (data) {
      console.log(data);
      this.obtener_carrito();
    }.bind(this));

    this.socket.on('new-carrito-add', function (data) {
      console.log(data);
      this.obtener_carrito();
    }.bind(this));

    this._guestService.obtener_descuento_activo().subscribe(
      response => {

        if (response.data != undefined) {
          this.descuento_activo = response.data[0];
        } else {
          this.descuento_activo = undefined;
        }
      }
    );
  }

  logout() {
    window.location.reload();
    localStorage.clear();
    this._router.navigate(['/']);
  }

  op_modalcart() {
    if (!this.op_cart) {
      this.op_cart = true;
      $('#cart').addClass('show');
    } else {
      this.op_cart = false;
      $('#cart').removeClass('show');
    }
  }

  calcular_carrito() {
    this.subtotal = 0;
    if (this.descuento_activo == undefined) {
      this.carrito_arr.forEach(element => {
        this.subtotal = this.subtotal + parseInt(element.producto.precio);
      });
    } else if (this.descuento_activo != undefined) {
      this.carrito_arr.forEach(element => {
        let new_precio = Math.round(parseInt(element.producto.precio) - (parseInt(element.producto.precio) * this.descuento_activo.descuento) / 100);
        this.subtotal = this.subtotal + new_precio;
      });
    }
  }

  eliminar_item(id) {
    this._clienteService.eliminar_carrito_cliente(id, this.token).subscribe(
      response => {
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Se eliminó el producto correctamente.'
        });
        this.socket.emit('delete-carrito', { data: response.data });
        console.log(response);
      }
    );
  }
}
