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

  async ngOnInit(): Promise<void> {
    // Cargar Stripe una sola vez
    this.stripe = await loadStripe('pk_test_51Mk4kXCLIarqTSG4NbIMTNpgZbMLGGc3eMPuSMjry8juYYGtCAl8wNyXuPBDAPl7mB6IXJX1ooHEGA7RQWWZZAmF00OJkwK7JD');
    if (!this.stripe) {
      console.error('Stripe no se cargó correctamente.');
      return;
    }

    // Crear y montar el elemento de tarjeta
    const elements = this.stripe.elements();
    this.card = elements.create('card');
    this.card.mount('#card-element');

    // Manejar eventos de cambio en el formulario de tarjeta
    this.card.on('change', (event) => {
      if (event.error) {
        iziToast.show({ title: 'Error', message: event.error.message, position: 'topRight' });
      } else if (event.complete) {
        console.log('Formulario de tarjeta completado.');
      }
    });

    // **IMPORTANTE**: Aquí ajustamos la carga de datos.
    // Primero obtenemos el descuento activo, y luego inicializamos los datos del carrito.
    this._guestService.obtener_descuento_activo().subscribe(
      response => {
        this.descuento_activo = response.data?.[0] || undefined;
        // Ahora sí, inicializamos los datos del carrito para que el descuento se aplique correctamente.
        this.init_Data();
      },
      error => {
        console.error('Error al obtener descuento activo:', error);
        this.init_Data(); // Cargar carrito incluso si falla la obtención del descuento
      }
    );

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
            amount: {
              currency_code: 'USD',
              value: this.total_pagar.toFixed(2)
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const order = await actions.order.capture();

        this.venta.transaccion = order.purchase_units[0].payments.captures[0].id;
        this.venta.detalles = this.dventa;

        this.venta.subtotal = this.venta.subtotal;
        this.venta.descuento = this.descuento || 0;
        this.venta.total_pagar = this.total_pagar;

        this._clienteService.registro_compra_cliente(this.venta, this.token).subscribe(
          response => {
            this.btn_load = false;
            iziToast.show({ title: 'Éxito', message: '¡Tu compra con PayPal se realizó con éxito!', position: 'topRight', titleColor: '#1DC74C' });

            this._clienteService.enviar_correo_compra_cliente(response.venta._id, this.token).subscribe(
              () => this._router.navigate(['/']),
              error => console.error('Error enviando correo:', error)
            );
          },
          error => {
            console.error('Error registrando compra:', error);
            iziToast.show({ title: 'Error', message: 'Error al registrar la compra.', position: 'topRight' });
          }
        );
      },
      onError: (err) => {
        console.error('Error en PayPal:', err);
        iziToast.show({ title: 'Error', message: 'Error al procesar el pago con PayPal', position: 'topRight' });
      }
    }).render(this.paypalElement.nativeElement);
  }

  async handlePayment() {
    this.btn_load = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
      }

      // El backend debe generar el clientSecret
      const clientSecretResponse: any = await this._clienteService.createPaymentIntent(this.total_pagar * 100, 'usd', token).toPromise();

      if (!clientSecretResponse || !clientSecretResponse.clientSecret) {
        throw new Error('No se pudo obtener el clientSecret del servidor. Verifica tu backend.');
      }

      const clientSecret = clientSecretResponse.clientSecret;

      // Confirmar el pago con Stripe
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: this.card }
      });

      if (result.error) {
        console.error('Error al confirmar el pago en Stripe:', result.error.message);
        iziToast.show({ title: 'Error', message: result.error.message, position: 'topRight' });
        this.btn_load = false;
        return;
      }

      // Si el pago es exitoso, registrar la venta
      this.venta.transaccion = result.paymentIntent.id;
      this.venta.detalles = this.dventa;

      this._clienteService.registro_compra_cliente(this.venta, token).subscribe(
        response => {
          this.btn_load = false;
          iziToast.show({
            title: 'Éxito',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Tu compra se realizó con éxito.'
          });

          this._clienteService.enviar_correo_compra_cliente(response.venta._id, this.token).subscribe(
            () => this._router.navigate(['/']),
            error => {
              console.error('Error enviando correo de confirmación:', error);
              this._router.navigate(['/']); // Redirigir de todos modos
            }
          );
        },
        error => {
          console.error('Error registrando compra:', error);
          iziToast.show({ title: 'Error', message: 'Error al registrar la compra.', position: 'topRight' });
          this.btn_load = false;
        }
      );

    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      iziToast.show({ title: 'Error', message: 'Ocurrió un error al procesar el pago: ' + error.message, position: 'topRight' });
      this.btn_load = false;
    }
  }

  init_Data() {
    this._clienteService.obtener_carrito_cliente(this.idcliente, this.token).subscribe(
      response => {
        this.carrito_arr = response.data;
        this.dventa = []; // Limpiar dventa antes de rellenar
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
        this.cacular_total(this.venta.envio_titulo || 'Envio Gratis'); // Usar el título de envío existente o un valor por defecto
      },
      error => {
        console.error('Error al obtener datos del carrito:', error);
        this.carrito_load = false;
        iziToast.show({ title: 'Error', message: 'No se pudieron cargar los productos del carrito.', position: 'topRight' });
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
      },
      error => {
        console.error('Error al obtener dirección principal:', error);
      }
    );
  }

  calcular_carrito() {
    this.subtotal = 0;
    if (this.descuento_activo) {
      this.carrito_arr.forEach(element => {
        let new_precio = Math.round(parseInt(element.producto.precio) - (parseInt(element.producto.precio) * this.descuento_activo.descuento) / 100);
        this.subtotal = this.subtotal + new_precio;
      });
    } else {
      this.carrito_arr.forEach(element => {
        this.subtotal = this.subtotal + parseInt(element.producto.precio);
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
      },
      error => {
        console.error('Error al eliminar item del carrito:', error);
        iziToast.show({ title: 'Error', message: 'No se pudo eliminar el producto.', position: 'topRight' });
      }
    );
  }

  cacular_total(envio_titulo) {
    let subtotalNum = parseInt(this.subtotal.toString());
    let envioNum = parseInt(this.precio_envio);

    this.venta.subtotal = subtotalNum; // Subtotal original sin envío ni descuento
    this.venta.envio_precio = envioNum;
    this.venta.envio_titulo = envio_titulo;

    if (this.descuento && this.descuento > 0) {
      this.total_pagar = subtotalNum + envioNum - this.descuento;
    } else {
      this.total_pagar = subtotalNum + envioNum;
    }

    this.venta.descuento = this.descuento || 0;

    console.log('Detalles de la Venta:');
    console.log('  Subtotal original:', subtotalNum);
    console.log('  Envío:', envioNum);
    console.log('  Descuento aplicado:', this.descuento);
    console.log('  Total final a pagar:', this.total_pagar);
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
              } else if (response.data.tipo == 'Porcentaje') {
                this.descuento = (this.subtotal * response.data.valor) / 100;
              }

              // Actualizar el total con el descuento y el envío
              this.cacular_total(this.venta.envio_titulo);

              // Guardar el descuento en la venta para enviarlo después
              this.venta.descuento = this.descuento;

            } else {
              this.error_cupon = 'El cupón no se pudo canjear.';
              this.descuento = 0;
              this.cacular_total(this.venta.envio_titulo); // recalcula sin descuento
            }
          },
          error => {
            console.error('Error al validar cupón:', error);
            this.error_cupon = 'Error al validar el cupón. Intenta de nuevo más tarde.';
            this.descuento = 0;
            this.cacular_total(this.venta.envio_titulo);
          }
        );
      } else {
        this.error_cupon = 'El cupón debe tener menos de 25 caracteres.';
      }
    } else {
      this.error_cupon = 'El cupón no es válido.';
    }
  }

  isCreditCardSelected(): boolean {
    const selectedPayment = document.querySelector('input[name="payment"]:checked') as HTMLInputElement;
    return selectedPayment?.id === 'cc';
  }
}
