import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { ProductListItem, Category, ProductStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'New Product' }}</h2>
    <mat-dialog-content [formGroup]="form" style="min-width:480px">
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Slug</mat-label>
        <input matInput formControlName="slug">
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Short Description</mat-label>
        <textarea matInput formControlName="shortDescription" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description" rows="3"></textarea>
      </mat-form-field>
      <div style="display:flex;gap:12px">
        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Price (₹)</mat-label>
          <input matInput type="number" formControlName="price">
        </mat-form-field>
        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Discount Price</mat-label>
          <input matInput type="number" formControlName="discountPrice">
        </mat-form-field>
        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Stock</mat-label>
          <input matInput type="number" formControlName="stockQuantity">
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Category</mat-label>
        <mat-select formControlName="categoryId">
          @for (cat of data.categories; track cat.id) {
            <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <div style="display:flex;gap:12px">
        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Material</mat-label>
          <input matInput formControlName="material">
        </mat-form-field>
        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Weight</mat-label>
          <input matInput formControlName="weight">
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Status</mat-label>
        <mat-select formControlName="status">
          <mat-option [value]="1">Active</mat-option>
          <mat-option [value]="2">Inactive</mat-option>
          <mat-option [value]="3">Out of Stock</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-checkbox formControlName="isFeatured" style="margin-bottom:12px">Featured</mat-checkbox>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Image URLs (comma-separated)</mat-label>
        <textarea matInput formControlName="imageUrls" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
})
export class ProductDialogComponent {
  readonly data = inject<{ product: ProductListItem | null; categories: Category[] }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ProductDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    name: [this.data.product?.name ?? '', Validators.required],
    slug: [this.data.product?.slug ?? ''],
    shortDescription: [this.data.product?.shortDescription ?? ''],
    description: [''],
    price: [null as number | null, Validators.required],
    discountPrice: [null as number | null],
    stockQuantity: [this.data.product?.stockQuantity ?? 0, Validators.required],
    categoryId: ['', Validators.required],
    material: [''],
    weight: [''],
    status: [this.data.product?.status ?? 1],
    isFeatured: [this.data.product?.isFeatured ?? false],
    imageUrls: [''],
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.dialogRef.close({
      ...v,
      imageUrls: (v.imageUrls ?? '').split(',').map((u: string) => u.trim()).filter((u: string) => !!u),
    });
  }
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CurrencyPipe, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatPaginatorModule, MatChipsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  products = signal<ProductListItem[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  readonly displayedColumns = ['name', 'category', 'price', 'stock', 'status', 'featured', 'actions'];
  readonly ProductStatus = ProductStatus;

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts({ page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (r) => { this.products.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(product: ProductListItem | null): void {
    const ref = this.dialog.open(ProductDialogComponent, {
      width: '600px',
      data: { product, categories: this.categories() },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (product) {
        this.productService.updateProduct(product.id, result).subscribe({
          next: () => { this.snackBar.open('Product updated!', 'Close', { duration: 2000 }); this.loadProducts(); },
          error: () => this.snackBar.open('Failed to update product', 'Close', { duration: 3000 }),
        });
      } else {
        this.productService.createProduct(result).subscribe({
          next: () => { this.snackBar.open('Product created!', 'Close', { duration: 2000 }); this.loadProducts(); },
          error: () => this.snackBar.open('Failed to create product', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  deleteProduct(product: ProductListItem): void {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.productService.deleteProduct(product.id).subscribe({
      next: () => { this.snackBar.open('Deleted', 'Close', { duration: 2000 }); this.loadProducts(); },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }

  onPageChange(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.loadProducts(); }
}
