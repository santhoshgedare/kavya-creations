import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductListItem, Category } from '../../../core/models/product.model';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink, CurrencyPipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(false);
  products = signal<ProductListItem[]>([]);
  categories = signal<Category[]>([]);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 12;

  filterForm = this.fb.group({
    search: [''],
    category: [''],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    sortBy: ['createdAt'],
    sortDir: ['desc'],
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));

    this.route.queryParams.subscribe(params => {
      this.filterForm.patchValue({
        search: params['search'] || '',
        category: params['category'] || '',
        minPrice: params['minPrice'] ? +params['minPrice'] : null,
        maxPrice: params['maxPrice'] ? +params['maxPrice'] : null,
        sortBy: params['sortBy'] || 'createdAt',
        sortDir: params['sortDir'] || 'desc',
      }, { emitEvent: false });
      this.page.set(params['page'] ? +params['page'] : 1);
      this.loadProducts();
    });

    this.filterForm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.updateQueryParams();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const v = this.filterForm.value;
    this.productService.getProducts({
      search: v.search || undefined,
      category: v.category || undefined,
      minPrice: v.minPrice ?? undefined,
      maxPrice: v.maxPrice ?? undefined,
      sortBy: v.sortBy || undefined,
      sortDir: v.sortDir || undefined,
      page: this.page(),
      pageSize: this.pageSize,
    }).subscribe({
      next: (result) => { this.products.set(result.items); this.totalCount.set(result.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateQueryParams(): void {
    const v = this.filterForm.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: v.search || null,
        category: v.category || null,
        minPrice: v.minPrice || null,
        maxPrice: v.maxPrice || null,
        sortBy: v.sortBy !== 'createdAt' ? v.sortBy : null,
        sortDir: v.sortDir !== 'desc' ? v.sortDir : null,
        page: this.page() > 1 ? this.page() : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.updateQueryParams();
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

  resetFilters(): void {
    this.filterForm.reset({ search: '', category: '', minPrice: null, maxPrice: null, sortBy: 'createdAt', sortDir: 'desc' });
    this.page.set(1);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.jpg';
  }
}
