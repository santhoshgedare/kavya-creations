import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/product.model';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent {
  cartService = inject(CartService);
  checkoutDone = false;

  updateQty(item: CartItem, delta: number): void {
    this.cartService.updateQuantity(item.product.id, item.quantity + delta);
  }

  remove(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  checkout(): void {
    this.cartService.clearCart();
    this.checkoutDone = true;
  }
}
