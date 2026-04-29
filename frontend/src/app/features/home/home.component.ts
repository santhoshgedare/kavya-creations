import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductListItem, Category } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  featuredProducts = signal<ProductListItem[]>([]);
  categories = signal<Category[]>([]);

  readonly trustItems = [
    { icon: 'verified', text: '100% Handcrafted' },
    { icon: 'local_shipping', text: 'Free Shipping ₹999+' },
    { icon: 'replay', text: 'Easy Returns' },
    { icon: 'support_agent', text: '24/7 Support' },
  ];

  ngOnInit(): void {
    this.productService.getFeaturedProducts().subscribe({
      next: (result) => { this.featuredProducts.set(result.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.productService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
    });
  }

  addToCart(productId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Please login to add items to cart', 'Close', { duration: 3000 });
      return;
    }
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => this.snackBar.open('Added to cart!', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 }),
    });
  }
}
