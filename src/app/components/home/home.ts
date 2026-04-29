import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product, Category } from '../../models/product.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  cartService = inject(CartService);

  featuredProducts: Product[] = [];
  categories: Category[] = [];
  loading = true;
  addedProductId: number | null = null;

  ngOnInit(): void {
    this.productService.getFeaturedProducts().subscribe({
      next: products => {
        this.featuredProducts = products;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.productService.getCategories().subscribe({
      next: cats => this.categories = cats
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.addedProductId = product.id;
    setTimeout(() => this.addedProductId = null, 1500);
  }
}
