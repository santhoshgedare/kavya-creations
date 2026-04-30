import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Cart } from '../models/order.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  private readonly _cart = signal<Cart | null>(null);

  readonly cart = this._cart.asReadonly();
  readonly cartItemCount = computed(() => this._cart()?.totalItems ?? 0);
  readonly cartTotal = computed(() => this._cart()?.total ?? 0);

  loadCart(): Observable<Cart | null> {
    return this.http.get<Cart | null>(this.baseUrl).pipe(
      tap(cart => this._cart.set(cart))
    );
  }

  addToCart(productId: string, quantity: number = 1, variantId?: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/items`, { productId, quantity, variantId }).pipe(
      tap(cart => this._cart.set(cart))
    );
  }

  updateQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/items/${productId}`, quantity).pipe(
      tap(cart => this._cart.set(cart))
    );
  }

  removeItem(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/items/${productId}`).pipe(
      tap(cart => this._cart.set(cart))
    );
  }

  clearLocal(): void {
    this._cart.set(null);
  }
}
