import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/order.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.cartService.loadCart().subscribe({ next: () => this.loading = false, error: () => this.loading = false });
  }

  updateQuantity(item: CartItem, qty: number): void {
    if (qty < 1) { this.removeItem(item); return; }
    this.cartService.updateQuantity(item.productId, qty).subscribe({
      error: () => this.snackBar.open('Failed to update quantity', 'Close', { duration: 3000 }),
    });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.productId).subscribe({
      next: () => this.snackBar.open('Item removed', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Failed to remove item', 'Close', { duration: 3000 }),
    });
  }
}
