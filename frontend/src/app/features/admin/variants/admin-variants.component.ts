import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { VariantService } from '../../../core/services/variant.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductVariant, ProductAttribute, ProductListItem } from '../../../core/models/product.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface VariantEdit {
  id: string;
  sku: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  attributeLabel: string;
  dirty: boolean;
}

@Component({
  selector: 'app-admin-variants',
  standalone: true,
  imports: [
    ReactiveFormsModule, CurrencyPipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, MatDialogModule,
  ],
  templateUrl: './admin-variants.component.html',
  styleUrl: './admin-variants.component.scss',
})
export class AdminVariantsComponent implements OnInit {
  private readonly variantService = inject(VariantService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  loading = signal(false);
  saving = signal(false);
  products = signal<ProductListItem[]>([]);
  attributes = signal<ProductAttribute[]>([]);
  variantRows = signal<VariantEdit[]>([]);
  selectedProductId = signal<string | null>(null);

  variantColumns = ['attributes', 'sku', 'price', 'stock', 'available', 'actions'];

  generateForm = this.fb.group({
    productId: ['', Validators.required],
    attributeValueIds: [[] as string[], Validators.required],
    defaultPrice: [0, [Validators.required, Validators.min(1)]],
    defaultStock: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadAttributes();
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 100 }).subscribe({
      next: (r) => this.products.set(r.items),
    });
  }

  loadAttributes(): void {
    this.variantService.getAllAttributes().subscribe({
      next: (attrs) => this.attributes.set(attrs),
    });
  }

  onProductSelect(productId: string): void {
    this.selectedProductId.set(productId);
    this.generateForm.patchValue({ productId });
    this.loadVariants(productId);
  }

  loadVariants(productId: string): void {
    this.loading.set(true);
    this.variantService.getProductVariants(productId).subscribe({
      next: (vs) => {
        this.variantRows.set(vs.map(v => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity,
          isAvailable: v.isAvailable,
          attributeLabel: v.attributeValues.map(av => `${av.attributeName}: ${av.displayValue}`).join(', '),
          dirty: false,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  generateVariants(): void {
    if (this.generateForm.invalid) return;
    const val = this.generateForm.value;
    this.variantService.generateVariants({
      productId: val.productId!,
      attributeValueIds: val.attributeValueIds ?? [],
      defaultPrice: val.defaultPrice!,
      defaultStock: val.defaultStock!,
    }).subscribe({
      next: (ids) => {
        this.snackBar.open(`Generated ${ids.length} variant${ids.length !== 1 ? 's' : ''}`, 'Close', { duration: 3000 });
        this.loadVariants(val.productId!);
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to generate variants', 'Close', { duration: 3000 }),
    });
  }

  updatePrice(row: VariantEdit, value: string): void {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      row.price = parsed;
      row.dirty = true;
    }
  }

  updateStock(row: VariantEdit, value: string): void {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      row.stockQuantity = parsed;
      row.dirty = true;
    }
  }

  get hasDirtyRows(): boolean {
    return this.variantRows().some(r => r.dirty);
  }

  saveAll(): void {
    const dirty = this.variantRows().filter(r => r.dirty);
    if (!dirty.length) return;
    this.saving.set(true);
    this.variantService.bulkUpdateVariants(
      dirty.map(r => ({ id: r.id, price: r.price, stockQuantity: r.stockQuantity }))
    ).subscribe({
      next: () => {
        this.snackBar.open(`Saved ${dirty.length} variant${dirty.length !== 1 ? 's' : ''}`, 'Close', { duration: 2500 });
        this.variantRows.update(rows => rows.map(r => ({ ...r, dirty: false })));
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to save changes', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  deleteVariant(row: VariantEdit): void {
    const data: ConfirmDialogData = {
      title: 'Delete Variant',
      message: `Delete variant "${row.attributeLabel || row.sku}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
      icon: 'delete_forever',
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.variantService.deleteVariant(row.id).subscribe({
          next: () => {
            this.snackBar.open('Variant deleted', 'Close', { duration: 2000 });
            this.variantRows.update(rows => rows.filter(r => r.id !== row.id));
          },
          error: () => this.snackBar.open('Failed to delete variant', 'Close', { duration: 3000 }),
        });
      });
  }

  getAllValues(): { id: string; label: string }[] {
    return this.attributes().flatMap(a =>
      a.values.map(v => ({ id: v.id, label: `${a.displayName}: ${v.displayValue}` }))
    );
  }
}
