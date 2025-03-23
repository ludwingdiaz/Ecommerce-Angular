import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { GLOBAL } from 'src/app/services/GLOBAL';
import { io } from "socket.io-client";
import { GuestService } from 'src/app/services/guest.service';
import { Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';
declare var iziToast;
declare var Cleave;
declare var StickySidebar;
declare var paypal;


interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  @ViewChild('paypalButton', { static: true }) paypalElement: ElementRef;

  public idcliente;
  public token;
  public carrito_arr: Array<any> = [];
  public url;
  public subtotal = 0;
  public total_pagar: any = 0;
  public socket = io('http://localhost:3000');
  public direccion_principal: any = {};
  public envios: Array<any> = [];
  public precio_envio = "0";
  public venta: any = {};
  public dventa: Array<any> = [];
  public btn_load = false;
  public carrito_load = true;
  public user: any = {};
  public descuento = 0;
  public error_cupon = '';
  public descuento_activo: any = undefined;

  private stripe: any;
  private card: any;

  constructor(
    private _clienteService: ClienteService,
    private _guestService: GuestService,
    private _router: Router
  ) {

    this.idcliente = localStorage.getItem('_id');
    this.venta.cliente = this.idcliente;
    this.token = localStorage.getItem('token');
    this.url = GLOBAL.url;

    this._guestService.get_Envios().subscribe(
      response => {
        this.envios = response;
      }
    );

    this.user = JSON.parse(localStorage.getItem('user_data'));
  }
  //handler: any = null;

  async ngOnInit(): Promise<void> {
    // Cargar Stripe una sola vez
    this.stripe = await loadStripe('pk_test_51Mk4kXCLIarqTSG4NbIMTNpgZbMLGGc3eMPuSMjry8juYYGtCAl8wNyXuPBDAPl7mB6IXJX1ooHEGA7RQWWZZAmF00OJkwK7JD');
    if (!this.stripe) {
      console.error('Stripe no se cargó correctamente');
      return;
    }

    // Crear y montar el elemento de tarjeta
    const elements = this.stripe.elements();
    this.card = elements.create('card');
    this.card.mount('#card-element');

    // Manejar eventos de cambio en el formulario de tarjeta
    this.card.on('change', (event) => {
      if (event.error) {
        console.error(event.error.message);
      } else if (event.complete) {
        console.log('Formulario de tarjeta completado');
      }
    });

    // Inicializar datos y PayPal
    this._guestService.obtener_descuento_activo().subscribe(
      response => {
        this.descuento_activo = response.data?.[0] || undefined;
        this.init_Data();
      }
    );

    this.init_Data();
    setTimeout(() => {
      new Cleave('#cc-number', { creditCard: true });
      new Cleave('#cc-exp-date', { date: true, datePattern: ['m', 'Y'] });
      new StickySidebar('.sidebar-sticky', { topSpacing: 20 });
    });

    this.get_direccion_principal();

    paypal.Buttons({
      style: { layout: 'horizontal' },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: 'Pago en Mi Tienda',
            amount: { currency_code: 'USD', value: this.subtotal }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const order = await actions.order.capture();
        this.venta.transaccion = order.purchase_units[0].payments.captures[0].id;
        this.venta.detalles = this.dventa;
        this._clienteService.registro_compra_cliente(this.venta, this.token).subscribe(
          response => {
            /*this._clienteService.enviar_correo_compra_cliente(response.venta._id, this.token).subscribe(
              () => this._router.navigate(['/']),
              error => console.error('Error enviando correo:', error)
            );*/
          },
          error => console.error('Error registrando compra:', error)
        );
      },
      onError: (err) => {
        console.error('Error en PayPal:', err);
        iziToast.show({ title: 'Error', message: 'Error al procesar el pago con PayPal' });
      }
    }).render(this.paypalElement.nativeElement);

    // Eliminar Cleave si no se usa (ya que #card-element maneja todo)
    setTimeout(() => {
      new StickySidebar('.sidebar-sticky', { topSpacing: 20 });
    });
  }

  async handlePayment() {
    this.btn_load = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');
      console.log('Token enviado:', token); // Para depuración

      // Crear PaymentIntent con Stripe
      const clientSecret = await this._clienteService.createPaymentIntent(this.subtotal * 100, 'usd', token).toPromise();

      // Confirmar el pago
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: this.card }
      });

      if (result.error) {
        console.error('Error en Stripe:', result.error.message);
        iziToast.show({ title: 'Error', message: result.error.message });
        this.btn_load = false; // Restablecer el estado de carga
        return; // Si hay un error, salimos de la función
      }

      // Registrar la venta
      this.venta.transaccion = result.paymentIntent.id;
      this.venta.detalles = this.dventa;

      this._clienteService.registro_compra_cliente(this.venta, token).subscribe(
        response => {
          // Una vez registrada la compra, mostramos el mensaje de éxito
          iziToast.show({ title: 'Gracias por tu compra', message: 'Tu compra se realizó con éxito' });

          // Redirigir al usuario a la home
          this._router.navigate(['/']);

          // Asegurarse de que el estado de carga se restablezca
          this.btn_load = false;
        },
        error => {
          console.error('Error registrando compra:', error);
          iziToast.show({ title: 'Error', message: 'Error al registrar la compra' });
          this.btn_load = false; // Restablecer el estado de carga
        }
      );
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      iziToast.show({ title: 'Error', message: 'Ocurrió un error al procesar el pago: ' + error.message });
      this.btn_load = false; // Restablecer el estado de carga
    }
  }



  init_Data() {
    this._clienteService.obtener_carrito_cliente(this.idcliente, this.token).subscribe(
      response => {
        this.carrito_arr = response.data;
        this.carrito_arr.forEach(element => {
          this.dventa.push({
            producto: element.producto._id,
            subtotal: element.producto.precio,
            variedad: element.variedad,
            cantidad: element.cantidad,
            cliente: localStorage.getItem('_id')
          });
        });
        this.carrito_load = false;
        this.calcular_carrito();
        this.cacular_total('Envio Gratis');
      }
    );
  }

  get_direccion_principal() {
    this._clienteService.obtener_direccion_principal_cliente(localStorage.getItem('_id'), this.token).subscribe(
      response => {
        if (response.data == undefined) {
          this.direccion_principal = undefined;
        } else {
          this.direccion_principal = response.data;
          this.venta.direccion = this.direccion_principal._id;
        }
      }
    );
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
        this.init_Data();
      }
    );
  }

  cacular_total(envio_titulo) {
    this.total_pagar = parseInt(this.subtotal.toString()) + parseInt(this.precio_envio);
    this.venta.subtotal = this.total_pagar;
    this.venta.envio_precio = parseInt(this.precio_envio);
    this.venta.envio_titulo = envio_titulo;

    console.log(this.venta);
  }

  validar_cupon() {
    if (this.venta.cupon) {
      if (this.venta.cupon.toString().length <= 25) {

        this._clienteService.validar_cupon_admin(this.venta.cupon, this.token).subscribe(
          response => {
            if (response.data != undefined) {
              this.error_cupon = '';

              if (response.data.tipo == 'Valor fijo') {
                this.descuento = response.data.valor;
                this.total_pagar = this.total_pagar - this.descuento;
              } else if (response.data.tipo == 'Porcentaje') {
                this.descuento = (this.total_pagar * response.data.valor) / 100;
                this.total_pagar = this.total_pagar - this.descuento;
              }
            } else {
              this.error_cupon = 'El cupon no se pudo canjear';
            }
          }
        );
      } else {
        this.error_cupon = 'El cupon debe ser menos de 25 caracteres';
      }
    } else {
      this.error_cupon = 'El cupon no es valido';
    }
  }

  isCreditCardSelected(): boolean {
    const selectedPayment = document.querySelector('input[name="payment"]:checked') as HTMLInputElement;
    return selectedPayment?.id === 'cc';
  }
}


