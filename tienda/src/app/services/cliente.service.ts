import { Injectable } from '@angular/core';
import { map, Observable } from "rxjs";
import { GLOBAL } from "./GLOBAL";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { JwtHelperService } from "@auth0/angular-jwt";
import { loadStripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  public url;
  private stripe;

  constructor(
    private _http: HttpClient,
  ) {
    this.url = GLOBAL.url;
    this.initStripe();
  }

  async initStripe() {
    this.stripe = await loadStripe('tu_api_key_publica_de_stripe');
  }

  obtener_direccion_principal_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_direccion_principal_cliente/' + id, { headers: headers });
  }

  loginCliente(data): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.post(this.url + 'loginCliente', data, { headers: headers });
  }

  obtener_cliente_guest(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_cliente_guest/' + id, { headers: headers });
  }

  actualizar_perfil_cliente_guest(id, data, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'actualizar_perfil_cliente_guest/' + id, data, { headers: headers });
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    try {
      const helper = new JwtHelperService();
      var decodedToken = helper.decodeToken(token);
      if (helper.isTokenExpired(token)) {
        localStorage.clear();
        return false;
      }
      if (!decodedToken) {
        localStorage.clear();
        return false;
      }
    } catch (error) {
      localStorage.clear();
      return false;
    }
    return true;
  }

  obtener_config_publico(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'obtener_config_publico', { headers: headers });
  }

  listar_productos_publico(filtro): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'listar_productos_publico/' + filtro, { headers: headers });
  }

  agregar_carrito_cliente(data, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'agregar_carrito_cliente', data, { headers: headers });
  }

  obtener_carrito_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_carrito_cliente/' + id, { headers: headers });
  }

  eliminar_carrito_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.delete(this.url + 'eliminar_carrito_cliente/' + id, { headers: headers });
  }

  registro_direccion_cliente(data, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'registro_direccion_cliente', data, { headers: headers });
  }

  obtener_direccion_todos_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_direccion_todos_cliente/' + id, { headers: headers });
  }

  cambiar_direccion_principal_cliente(id, cliente, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.put(this.url + 'cambiar_direccion_principal_cliente/' + id + '/' + cliente, { data: true }, { headers: headers });
  }

  registro_compra_cliente(data, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'registro_compra_cliente', data, { headers: headers });
  }

  // Método ajustado para createPaymentIntent
  createPaymentIntent(amount: number, currency: string, token: string): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token
    });
    const body = { amount, currency };
    return this._http.post(this.url + 'create-payment-intent', body, { headers })
      .pipe(
        map((response: any) => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.client_secret;
        })
      );
  }

  enviar_correo_compra_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'enviar_correo_compra_cliente/' + id, { headers: headers });
  }

  validar_cupon_admin(cupon, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'validar_cupon_admin/' + cupon, { headers: headers });
  }


  obtener_ordenes_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_ordenes_cliente/' + id, { headers: headers });
  }
  obtener_detalles_ordenes_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_detalles_ordenes_cliente/' + id, { headers: headers });
  }

  emitir_review_producto_cliente(data, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.post(this.url + 'emitir_review_producto_cliente', data, { headers: headers });
  }

  obtener_review_producto_cliente(id): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'obtener_review_producto_cliente/' + id, { headers: headers });
  }

  obtener_reviews_cliente(id, token): Observable<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
    return this._http.get(this.url + 'obtener_reviews_cliente/' + id, { headers: headers });
  }
}
