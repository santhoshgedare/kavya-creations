import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductListItem, ProductStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  product = signal<Product | null>(null);
  relatedProducts = signal<ProductListItem[]>([]);
  selectedImage = signal<string>('');
  quantity = signal(1);
  readonly ProductStatus = ProductStatus;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['slug']) this.loadProduct(params['slug']);
    });
  }

  loadProduct(slug: string): void {
    this.loading.set(true);
    this.productService.getProductBySlug(slug).subscribe({
      next: (p) => {
        this.product.set(p);
        const primary = p.images.find(i => i.isPrimary)?.url ?? p.images[0]?.url ?? '';
        this.selectedImage.set(primary);
        this.loading.set(false);
        this.loadRelated(p.categoryId, p.id);
      },
      error: () => this.loading.set(false),
    });
  }

  loadRelated(categoryId: string, excludeId: string): void {
    this.productService.getProducts({ category: categoryId, pageSize: 4 }).subscribe({
      next: (r) => this.relatedProducts.set(r.items.filter(p => p.id !== excludeId)),
    });
  }

  adjustQuantity(delta: number): void {
    const max = this.product()?.stockQuantity ?? 1;
    this.quantity.update(q => Math.max(1, Math.min(max, q + delta)));
  }

  addToCart(): void {
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Please login to add items to cart', 'Close', { duration: 3000 });
      return;
    }
    const p = this.product();
    if (!p) return;
    this.cartService.addToCart(p.id, this.quantity()).subscribe({
      next: () => this.snackBar.open('Added to cart!', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 }),
    });
  }
}
