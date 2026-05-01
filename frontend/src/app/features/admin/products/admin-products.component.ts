import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { ProductListItem, ProductStatus } from '../../../core/models/product.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CurrencyPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatProgressSpinnerModule, MatPaginatorModule, MatChipsModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  products = signal<ProductListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  readonly displayedColumns = ['name', 'category', 'price', 'stock', 'status', 'featured', 'actions'];
  readonly ProductStatus = ProductStatus;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts({ page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (r) => { this.products.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.router.navigate(['/admin/products/create']);
  }

  openEdit(product: ProductListItem): void {
    this.router.navigate(['/admin/products/edit', product.id]);
  }

  deleteProduct(product: ProductListItem): void {
    const data: ConfirmDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
      icon: 'delete_forever',
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.productService.deleteProduct(product.id).subscribe({
          next: () => { this.snackBar.open('Product deleted', 'Close', { duration: 2000 }); this.loadProducts(); },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
        });
      });
  }

  onPageChange(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.loadProducts(); }
}
