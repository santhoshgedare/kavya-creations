import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private sub?: Subscription;

  products: Product[] = [];
  loading = true;
  selectedCategory = '';
  searchQuery = '';
  addedProductId: number | null = null;

  readonly categories = [
    { slug: '', label: 'All' },
    { slug: 'bangles', label: 'Bangles' },
    { slug: 'earrings', label: 'Earrings' },
    { slug: 'necklaces', label: 'Necklaces' },
    { slug: 'accessories', label: 'Accessories' },
  ];

  get filteredProducts(): Product[] {
    if (!this.searchQuery.trim()) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q)
    );
  }

  get pageTitle(): string {
    const cat = this.categories.find(c => c.slug === this.selectedCategory);
    return cat && cat.slug ? cat.label : 'All Jewellery';
  }

  ngOnInit(): void {
    this.sub = this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.selectedCategory || undefined).subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  selectCategory(slug: string): void {
    this.selectedCategory = slug;
    this.loadProducts();
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.addToCart(product);
    this.addedProductId = product.id;
    setTimeout(() => this.addedProductId = null, 1500);
  }
}
