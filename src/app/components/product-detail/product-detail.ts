import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product: Product | null = null;
  loading = true;
  notFound = false;
  quantity = 1;
  added = false;
  relatedProducts: Product[] = [];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) { this.notFound = true; this.loading = false; return; }

    this.productService.getProductById(id).subscribe({
      next: product => {
        this.product = product;
        this.loading = false;
        this.loadRelated(product.category, product.id);
      },
      error: () => { this.notFound = true; this.loading = false; }
    });
  }

  loadRelated(category: string, excludeId: number): void {
    this.productService.getProducts(category).subscribe({
      next: products => {
        this.relatedProducts = products.filter(p => p.id !== excludeId).slice(0, 4);
      }
    });
  }

  adjustQuantity(delta: number): void {
    this.quantity = Math.max(1, Math.min(this.product?.stockQuantity ?? 1, this.quantity + delta));
  }

  addToCart(): void {
    if (!this.product) return;
    for (let i = 0; i < this.quantity; i++) {
      this.cartService.addToCart(this.product);
    }
    this.added = true;
    setTimeout(() => this.added = false, 2000);
  }

  addRelatedToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.addToCart(product);
  }
}
